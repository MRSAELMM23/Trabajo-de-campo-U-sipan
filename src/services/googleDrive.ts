import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Scopes configurados para Google Drive
export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of SCOPES) {
  provider.addScope(scope);
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // En recargas sin signIn reciente en memoria, se requiere volver a autenticar para obtener el token de acceso
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
}

// Subir video o archivo a Google Drive mediante multipart upload
export async function uploadVideoToDrive(
  fileBlob: Blob,
  fileName: string,
  description: string = 'Metraje del trabajo de campo en Úcupe (Lambayeque, 07/11/2026)'
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No autenticado en Google Drive. Por favor inicia sesión.');
  }

  // Especificar explícitamente parents: ['root'] para asegurar que aparezca en la raíz de "Mi unidad"
  const metadata = {
    name: fileName,
    mimeType: fileBlob.type || 'video/webm',
    description,
    parents: ['root'],
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', fileBlob);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,size,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error de Google Drive (${res.status}): ${errText}`);
  }

  return await res.json();
}

// Listar archivos de video ubicados en la carpeta raíz ('root' in parents) del usuario en Google Drive
export async function listRootVideoFiles(onlyVideos: boolean = true): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  // Filtro para la carpeta raíz de Mi unidad
  let queryCondition = "trashed = false and 'root' in parents";
  if (onlyVideos) {
    queryCondition += " and (mimeType contains 'video' or name contains '.webm' or name contains '.mp4' or name contains '.mov' or name contains 'Ucupe')";
  }

  const query = encodeURIComponent(queryCondition);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=100&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,size,thumbnailLink,parents)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    console.error('Error al consultar videos en la carpeta raíz de Google Drive:', await res.text());
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

// Listar todos los archivos de video y proyectos en Google Drive
export async function listDriveFiles(filterRootOnly: boolean = false): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const queryCondition = filterRootOnly
    ? "trashed = false and 'root' in parents and (mimeType contains 'video' or name contains '.webm' or name contains '.mp4' or name contains 'Ucupe')"
    : "trashed = false and (mimeType contains 'video' or name contains '.webm' or name contains '.mp4' or name contains 'Ucupe')";

  const query = encodeURIComponent(queryCondition);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=100&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,size,thumbnailLink,parents)`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    console.error('Error al consultar archivos en Drive:', await res.text());
    return [];
  }

  const data = await res.json();
  return data.files || [];
}

// Eliminar archivo con confirmación previa
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('No autenticado');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Error al eliminar archivo: ${await res.text()}`);
  }
}
