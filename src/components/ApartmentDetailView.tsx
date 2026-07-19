import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import 'firebase/compat/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { LucideIcon } from './LucideIcon';

const isAIStudioEnv = () => {
  const hostname = window.location.hostname;
  return hostname.includes('ais-dev') || hostname.includes('ais-pre') || hostname.includes('localhost') || hostname === '127.0.0.1';
};

const getAuthInstance = () => {
  // In AI Studio workspace (development or preview), we use the auto-provisioned workspace app ('appletApp')
  // because its domains are automatically authorized by the system.
  // In production (such as Netlify), we use the default app (initialized with the user's custom Firebase config),
  // provided the user adds their production domain to their custom Firebase Authorized Domains list.
  if (isAIStudioEnv()) {
    try {
      const appletApp = firebase.app('appletApp');
      return appletApp.auth();
    } catch (e) {
      try {
        const appletApp = firebase.initializeApp(firebaseConfig, 'appletApp');
        return appletApp.auth();
      } catch (err) {
        console.error("Failed to get or init appletApp, falling back to default:", err);
        return firebase.auth();
      }
    }
  }
  return firebase.auth();
};
import { Apartment, Payment, Repair, Provider, Mortgage, Expense, Inventory, DocumentItem } from '../types';
import { ModalForm } from './ModalForm';
import { ExpenseModal } from './ExpenseModal';
import { calculateCpiLinkedRent } from '../utils/cpi';

interface ApartmentDetailViewProps {
  apt: Apartment;
  payments: Payment[];
  repairs: Repair[];
  providers: Provider[];
  mortgages: Mortgage[];
  expenses: Expense[];
  inventory: Inventory[];
  documents?: DocumentItem[];
  cpiHistory?: any[];
  onSavePayment: (data: any, id?: string) => void;
  onDeletePayment: (id: string) => void;
  onSaveRepair: (data: any, id?: string) => void;
  onDeleteRepair: (id: string) => void;
  onSaveExpense: (data: any, id?: string) => void;
  onDeleteExpense: (id: string) => void;
  onSaveMortgage: (data: any, id: string) => void;
  onSaveInventory: (data: any, id?: string) => void;
  onDeleteInventory: (id: string) => void;
  onSaveDocument?: (data: any, id?: string) => void;
  onDeleteDocument?: (id: string, storagePath?: string) => void;
  onBack: () => void;
  t: (key: string) => string;
  onEditRentSegments?: (apt: Apartment) => void;
  lang?: string;
  appId?: string;
  globalCurrency?: string;
  usdToIlsRate?: number;
  eurToIlsRate?: number;
  cpiType?: 'cpi' | 'construction';
}

export const ApartmentDetailView: React.FC<ApartmentDetailViewProps> = ({
  apt,
  payments,
  repairs,
  providers,
  mortgages,
  expenses,
  inventory,
  documents = [],
  cpiHistory = [],
  onSavePayment,
  onDeletePayment,
  onSaveRepair,
  onDeleteRepair,
  onSaveExpense,
  onDeleteExpense,
  onSaveMortgage,
  onSaveInventory,
  onDeleteInventory,
  onSaveDocument = (data: any, id?: string) => {},
  onDeleteDocument = (id: string, storagePath?: string) => {},
  onBack,
  t,
  onEditRentSegments,
  lang = 'he',
  appId = '',
  globalCurrency,
  usdToIlsRate = 3.7,
  eurToIlsRate = 4.0,
  cpiType = 'cpi'
}) => {
  const [view, setView] = useState('summary');
  const [showForm, setShowForm] = useState(false);
  const [showTax, setShowTax] = useState(false);

  const [expenseFilterType, setExpenseFilterType] = useState('');
  const [expenseFilterFrom, setExpenseFilterFrom] = useState('');
  const [expenseFilterTo, setExpenseFilterTo] = useState('');

  const [inventoryFilterType, setInventoryFilterType] = useState('');
  const [inventoryFilterFrom, setInventoryFilterFrom] = useState('');
  const [inventoryFilterTo, setInventoryFilterTo] = useState('');

  const formatMonthString = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length < 2) return val;
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return val;
    
    const monthKeys = [
      'month_jan', 'month_feb', 'month_mar', 'month_apr',
      'month_may', 'month_jun', 'month_jul', 'month_aug',
      'month_sep', 'month_oct', 'month_nov', 'month_dec'
    ];
    return `${t(monthKeys[monthNum - 1])} ${year}`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getInventoryIconName = (type: string): string => {
    const lower = (type || '').toLowerCase().trim();
    if (lower.includes('ac') || lower.includes('מזגן') || lower.includes('conditioner')) return 'Wind';
    if (lower.includes('fridge') || lower.includes('מקרר') || lower.includes('refrigerator')) return 'Refrigerator';
    if (lower.includes('tv') || lower.includes('טלוויזיה') || lower.includes('television')) return 'Tv';
    if (lower.includes('stove') || lower.includes('כיריים') || lower.includes('hob') || lower.includes('תנור') || lower.includes('oven')) return 'Flame';
    if (lower.includes('speakers') || lower.includes('רמקולים') || lower.includes('speaker')) return 'Volume2';
    if (lower.includes('kettle') || lower.includes('קומקום')) return 'Coffee';
    if (lower.includes('vacuum') || lower.includes('שואב') || lower.includes('cleaner')) return 'Wind';
    if (lower.includes('toaster') || lower.includes('מצנם')) return 'Zap';
    return 'Wrench';
  };

  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editingRepair, setEditingRepair] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingInventory, setEditingInventory] = useState<any>(null);
  const [newExpenseTemplate, setNewExpenseTemplate] = useState<any>(null);

  // Document states
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [docCategoryFilter, setDocCategoryFilter] = useState<'all' | 'contract' | 'insurance' | 'receipt' | 'other'>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Document Form States
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'contract' | 'insurance' | 'receipt' | 'other'>('contract');
  const [docDate, setDocDate] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docTextCopy, setDocTextCopy] = useState('');
  const [docStorageMethod, setDocStorageMethod] = useState<'text' | 'file'>('text');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [copierSuccess, setCopierSuccess] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showWarningNotice, setShowWarningNotice] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [saveToDriveSuccess, setSaveToDriveSuccess] = useState(false);
  const [saveToDriveOnUpload, setSaveToDriveOnUpload] = useState(false);
  const [isSavingToDriveOnUpload, setIsSavingToDriveOnUpload] = useState(false);

  const [previewViewer, setPreviewViewer] = useState<'direct' | 'google' | 'microsoft'>('direct');
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotate, setImageRotate] = useState(0);

  useEffect(() => {
    if (previewDoc) {
      setImageZoom(1);
      setImageRotate(0);
      setSaveToDriveSuccess(false);
      
      const fileName = previewDoc.fileName || '';
      const isWord = !!(fileName.match(/\.(docx|doc)$/i) || previewDoc.url?.includes('msword') || previewDoc.url?.includes('word'));
      const isExcel = !!(fileName.match(/\.(xlsx|xls|csv)$/i) || previewDoc.url?.includes('excel') || previewDoc.url?.includes('spreadsheet') || previewDoc.url?.includes('csv'));
      
      if ((isWord || isExcel) && previewDoc.url && !previewDoc.url.startsWith('data:')) {
        setPreviewViewer('google');
      } else {
        setPreviewViewer('direct');
      }
    }
  }, [previewDoc]);

  useEffect(() => {
    if (view === 'documents') {
      setShowWarningNotice(true);
      const timer = setTimeout(() => {
        setShowWarningNotice(false);
      }, 3500); // 3.5s is an elegant length of time to read, then fades
      return () => clearTimeout(timer);
    }
  }, [view]);

  const base64ToBlob = (base64Data: string): Blob => {
    try {
      const parts = base64Data.split(';base64,');
      const contentType = parts[0].split(':')[1] || 'application/octet-stream';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch (e) {
      console.error("Failed to parse base64 string", e);
      return new Blob([], { type: 'application/octet-stream' });
    }
  };

  const getOrCreateDriveFolder = async (token: string): Promise<string> => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}${mm}${yyyy}`;

    const aptIdentifier = apt.nickname || apt.address || 'apartment';
    const cleanAptName = aptIdentifier
      .replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '') // Keep alphanumeric and Hebrew letters
      .trim();
    
    const folderName = `${cleanAptName}${dateStr}`;

    try {
      // 1. Search if the folder already exists
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      )}`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
          return searchData.files[0].id;
        }
      }

      // 2. Folder doesn't exist, create it
      const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });

      if (createFolderResponse.ok) {
        const folderData = await createFolderResponse.json();
        return folderData.id;
      }

      const errText = await createFolderResponse.text();
      console.error("Failed to create folder:", errText);
      throw new Error(`Failed to create Google Drive folder: ${errText}`);
    } catch (e: any) {
      console.error("getOrCreateDriveFolder error:", e);
      throw e;
    }
  };

  const handleSaveToDrive = async () => {
    if (!previewDoc) return;
    setIsSavingToDrive(true);
    setSaveToDriveSuccess(false);

    try {
      let currentToken = driveAccessToken;

      // If no token exists, authenticate first
      if (!currentToken) {
        const appletAuth = getAuthInstance();
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        
        const result = await appletAuth.signInWithPopup(provider);
        const credential = result.credential as firebase.auth.OAuthCredential;
        if (credential && credential.accessToken) {
          currentToken = credential.accessToken;
          setDriveAccessToken(currentToken);
        } else {
          throw new Error(lang === 'he' ? 'לא התקבל קוד גישה מ-Google' : 'No access token received from Google');
        }
      }

      // Convert file/URL to blob
      let fileBlob: Blob;
      const fileUrl = previewDoc.url;

      if (!fileUrl) {
        throw new Error(lang === 'he' ? 'אין קובץ מצורף לשמירה' : 'No file attachment to save');
      }

      if (fileUrl.startsWith('data:')) {
        // Base64 fallback data
        fileBlob = base64ToBlob(fileUrl);
      } else {
        // Fetch from Storage URL
        const blobResponse = await fetch(fileUrl);
        fileBlob = await blobResponse.blob();
      }

      // Get or create dynamic unique folder
      const folderId = await getOrCreateDriveFolder(currentToken);

      // 1. Create Google Drive file metadata with parent folder
      const mimeType = previewDoc.fileName?.match(/\.pdf$/i) ? 'application/pdf' : 
                       previewDoc.fileName?.match(/\.xlsx$/i) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                       previewDoc.fileName?.match(/\.docx$/i) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                       previewDoc.fileName?.match(/\.xls$/i) ? 'application/vnd.ms-excel' :
                       previewDoc.fileName?.match(/\.doc$/i) ? 'application/msword' :
                       fileBlob.type || 'application/octet-stream';

      const metadataResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: previewDoc.fileName || previewDoc.title || 'document',
          mimeType: mimeType,
          parents: folderId ? [folderId] : []
        })
      });

      if (!metadataResponse.ok) {
        const errText = await metadataResponse.text();
        throw new Error(`Drive metadata creation failed: ${errText}`);
      }

      const metadata = await metadataResponse.json();
      const fileId = metadata.id;

      // 2. Upload the raw media content to the created Google Drive file
      const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': mimeType
        },
        body: fileBlob
      });

      if (!uploadResponse.ok) {
        const errText = await uploadResponse.text();
        throw new Error(`Drive media upload failed: ${errText}`);
      }

      setSaveToDriveSuccess(true);
      alert(lang === 'he' ? `הקובץ נשמר בהצלחה בתיקייה ייעודית ב-Google Drive שלכם!` : 'File successfully saved to a dedicated folder in your Google Drive!');
    } catch (err: any) {
      console.error("Save to Google Drive failed:", err);
      // Clear token on authorization failure so user can sign in again
      if (err.status === 401 || err.message?.includes('auth') || err.message?.includes('permission')) {
        setDriveAccessToken(null);
      }
      alert((lang === 'he' ? 'שמירה ב-Drive נכשלה: ' : 'Saving to Drive failed: ') + (err.message || err));
    } finally {
      setIsSavingToDrive(false);
    }
  };

  const downloadFile = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      // Ensure cross-origin downloads work when possible, or open in new tab if blocked
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed, opening in new tab instead:", err);
      window.open(url, '_blank');
    }
  };

  const compressImage = (file: File | Blob): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file instanceof File ? file.name : "image.jpg", { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.75
        );
      };
      img.onerror = () => {
        resolve(file);
      };
    });
  };

  const convertToBase64 = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrBlob);
    });
  };

  const uploadToStorage = async (fileOrBlob: File | Blob, name: string): Promise<{ url: string; path: string }> => {
    setIsUploading(true);
    setUploadProgress(10);
    
    // Auto-compress if it's an image
    let finalFileOrBlob = fileOrBlob;
    if (fileOrBlob.type.startsWith('image/')) {
      try {
        finalFileOrBlob = await compressImage(fileOrBlob);
      } catch (compErr) {
        console.error("Compression failed:", compErr);
      }
    }

    try {
      setUploadProgress(25);
      const uniqueId = Math.random().toString(36).substring(2, 9);
      const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `artifacts/${appId}/documents/${Date.now()}_${uniqueId}_${sanitizedName}`;
      
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(storagePath);
      
      setUploadProgress(45);
      
      // We will race the upload with a 4 seconds timeout to fail fast
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Storage upload timed out")), 4000)
      );

      // Attempt actual upload
      const uploadPromise = fileRef.put(finalFileOrBlob);
      
      await Promise.race([uploadPromise, timeoutPromise]);
      
      setUploadProgress(85);
      const url = await fileRef.getDownloadURL();
      setUploadProgress(100);
      return { url, path: storagePath };
    } catch (e: any) {
      console.warn("Storage upload failed or timed out, using Base64 local database fallback...", e);
      
      // Fallback: convert file/blob to Base64 Data URL and store it directly in Firestore
      try {
        if (finalFileOrBlob.size > 1.5 * 1024 * 1024) {
          throw new Error(lang === 'he' ? "הקובץ גדול מדי (מעל 1.5MB) ולא ניתן לשמירה ללא חיבור לשרת Firebase Storage פעיל." : "File is too large (over 1.5MB) to save without an active Firebase Storage service.");
        }
        setUploadProgress(75);
        const base64Data = await convertToBase64(finalFileOrBlob);
        setUploadProgress(100);
        return { url: base64Data, path: "database_fallback_base64" };
      } catch (fallbackErr: any) {
        alert((lang === 'he' ? "שגיאה בשמירת המסמך: " : "Error saving document: ") + fallbackErr.message);
        throw fallbackErr;
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const openAddDoc = () => {
    setEditingDoc(null);
    setDocTitle('');
    setDocCategory('contract');
    setDocDate(new Date().toISOString().split('T')[0]);
    setDocNotes('');
    setDocTextCopy('');
    setDocStorageMethod('text');
    setDocFile(null);
    setSaveToDriveOnUpload(false);
    setShowDocModal(true);
  };

  const openEditDoc = (doc: DocumentItem) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocCategory(doc.category);
    setDocDate(doc.date || new Date().toISOString().split('T')[0]);
    setDocNotes(doc.notes || '');
    setDocTextCopy(doc.textCopy || '');
    setDocStorageMethod(doc.textCopy ? 'text' : 'file');
    setDocFile(null);
    setSaveToDriveOnUpload(false);
    setShowDocModal(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      alert(lang === 'he' ? 'יש להזין כותרת' : 'Please enter a title');
      return;
    }

    let finalUrl = editingDoc?.url || '';
    let finalStoragePath = editingDoc?.storagePath || '';
    let finalFileName = editingDoc?.fileName || '';
    let finalFileSize = editingDoc?.fileSize || 0;
    let finalTextCopy = docTextCopy;

    try {
      if (!editingDoc) {
        // Adding new
        if (docStorageMethod === 'text') {
          if (docTextCopy.trim()) {
            const blob = new Blob([docTextCopy], { type: 'text/plain;charset=utf-8' });
            const virtualName = `${docTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_copy.txt`;
            const res = await uploadToStorage(blob, virtualName);
            finalUrl = res.url;
            finalStoragePath = res.path;
            finalFileName = virtualName;
            finalFileSize = blob.size;
          }
        } else {
          // File upload
          if (docFile) {
            const res = await uploadToStorage(docFile, docFile.name);
            finalUrl = res.url;
            finalStoragePath = res.path;
            finalFileName = docFile.name;
            finalFileSize = docFile.size;
            finalTextCopy = '';
          } else {
            alert(lang === 'he' ? 'יש לבחור קובץ להעלאה' : 'Please select a file to upload');
            return;
          }
        }
      } else {
        // Editing existing
        if (docStorageMethod === 'file' && docFile) {
          const res = await uploadToStorage(docFile, docFile.name);
          finalUrl = res.url;
          finalStoragePath = res.path;
          finalFileName = docFile.name;
          finalFileSize = docFile.size;
          finalTextCopy = '';
        } else if (docStorageMethod === 'text' && docTextCopy !== (editingDoc.textCopy || '')) {
          const blob = new Blob([docTextCopy], { type: 'text/plain;charset=utf-8' });
          const virtualName = `${docTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_copy.txt`;
          const res = await uploadToStorage(blob, virtualName);
          finalUrl = res.url;
          finalStoragePath = res.path;
          finalFileName = virtualName;
          finalFileSize = blob.size;
        }
      }

      // If user toggled Google Drive backup on upload
      if (saveToDriveOnUpload && finalUrl) {
        setIsSavingToDriveOnUpload(true);
        try {
          let currentToken = driveAccessToken;

          // If no token exists, authenticate first
          if (!currentToken) {
            const appletAuth = getAuthInstance();
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/drive.file');
            
            const result = await appletAuth.signInWithPopup(provider);
            const credential = result.credential as firebase.auth.OAuthCredential;
            if (credential && credential.accessToken) {
              currentToken = credential.accessToken;
              setDriveAccessToken(currentToken);
            } else {
              throw new Error(lang === 'he' ? 'לא התקבל קוד גישה מ-Google' : 'No access token received from Google');
            }
          }

          // Convert URL/data to blob
          let fileBlob: Blob;
          if (finalUrl.startsWith('data:')) {
            fileBlob = base64ToBlob(finalUrl);
          } else {
            const blobResponse = await fetch(finalUrl);
            fileBlob = await blobResponse.blob();
          }

          // Find or create dynamic unique folder on Drive
          const folderId = await getOrCreateDriveFolder(currentToken);

          const mimeType = finalFileName.match(/\.pdf$/i) ? 'application/pdf' : 
                           finalFileName.match(/\.xlsx$/i) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                           finalFileName.match(/\.docx$/i) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                           finalFileName.match(/\.xls$/i) ? 'application/vnd.ms-excel' :
                           finalFileName.match(/\.doc$/i) ? 'application/msword' :
                           fileBlob.type || 'application/octet-stream';

          // 1. Create Google Drive file metadata with parent folder
          const metadataResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: finalFileName || docTitle.trim() || 'document',
              mimeType: mimeType,
              parents: folderId ? [folderId] : []
            })
          });

          if (!metadataResponse.ok) {
            const errText = await metadataResponse.text();
            throw new Error(`Drive metadata creation failed: ${errText}`);
          }

          const metadata = await metadataResponse.json();
          const fileId = metadata.id;

          // 2. Upload raw media content
          const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${currentToken}`,
              'Content-Type': mimeType
            },
            body: fileBlob
          });

          if (!uploadResponse.ok) {
            const errText = await uploadResponse.text();
            throw new Error(`Drive media upload failed: ${errText}`);
          }
          
          alert(lang === 'he' ? 'הקובץ נשמר בהצלחה בתיקייה ייעודית ב-Google Drive שלכם!' : 'File successfully saved to a dedicated folder in your Google Drive!');
        } catch (driveErr: any) {
          console.error("Direct upload to Google Drive failed:", driveErr);
          // Alert user that local save succeeded but Drive backup failed
          alert(
            (lang === 'he' 
              ? 'המסמך נשמר באפליקציה, אך הגיבוי ל-Google Drive נכשל: ' 
              : 'Document saved in application, but Google Drive backup failed: ') + 
            (driveErr.message || driveErr)
          );
        } finally {
          setIsSavingToDriveOnUpload(false);
        }
      }

      const payload = {
        aptId: apt.id,
        title: docTitle.trim(),
        category: docCategory,
        date: docDate,
        notes: docNotes.trim(),
        url: finalUrl,
        storagePath: finalStoragePath,
        fileName: finalFileName,
        fileSize: finalFileSize,
        textCopy: finalTextCopy
      };

      onSaveDocument(payload, editingDoc?.id);
      setShowDocModal(false);
    } catch (err: any) {
      console.error("Save failed:", err);
    }
  };

  const isTenant = apt.status === 'tenant';

  const getSymbolForCurrency = (currencyCode: string): string => {
    const code = currencyCode || '₪';
    if (code === 'ILS' || code === '₪' || code === 'ש"ח') {
      return '₪';
    }
    if (code === 'USD' || code === '$') return '$';
    if (code === 'EUR' || code === '€') return '€';
    return code;
  };

  const cur = getSymbolForCurrency(globalCurrency || apt.currency || '₪');

  const convertVal = (value: number) => {
    if (!globalCurrency) return value;
    const from = apt.currency || '₪';
    const to = globalCurrency;
    const fromSym = getSymbolForCurrency(from);
    const toSym = getSymbolForCurrency(to);
    if (fromSym === toSym) return value;

    // Convert "from" to ILS (base)
    let valueInILS = value;
    if (fromSym === '$') {
      valueInILS = value * usdToIlsRate;
    } else if (fromSym === '€') {
      valueInILS = value * eurToIlsRate;
    }

    let converted = value;
    // Convert ILS to "to"
    if (toSym === '₪' || toSym === 'ש"ח') {
      converted = valueInILS;
    } else if (toSym === '$') {
      converted = valueInILS / usdToIlsRate;
    } else if (toSym === '€') {
      converted = valueInILS / eurToIlsRate;
    }
    return Math.round(converted * 100) / 100;
  };

  const SERVICE_TYPES_KEYS = ['electrician', 'plumber', 'solar', 'ac_label', 'renovation', 'paint', 'pest', 'other'];
  const PAYMENT_METHODS_KEYS = ['pm_credit_card', 'pm_bank_transfer', 'pm_cash', 'pm_check', 'pm_app', 'pm_other'];
  const INVENTORY_TYPES_KEYS = ['ac', 'fridge', 'tv', 'stove', 'speakers', 'kettle', 'vacuum', 'toaster', 'other_appliance'];
  const PAID_BADGE_TYPES = ['hoa', 'arnona', 'mortgage', 'rent', 'insurance', 'management_fee'];
  const SPECIAL_EXPENSE_TYPES = ['professional_services', 'taxes_fees', 'supplies', 'mortgage', 'rent'];

  const paymentFields = [
    { key: 'amount', label: t('amount'), type: 'number' },
    { key: 'date', label: t('date'), type: 'date' },
    { key: 'notes', label: t('notes'), type: 'textarea', placeholder: '...' }
  ];

  const repairFields = [
    { key: 'type', label: t('type'), type: 'select', options: SERVICE_TYPES_KEYS.map(k => ({ id: t(k), name: t(k) })) },
    { key: 'providerName', label: t('provider'), type: 'select', options: providers.map(p => ({ id: p.name, name: p.name })) },
    { key: 'date', label: t('date'), type: 'date' },
    { key: 'cost', label: t('cost'), type: 'number' },
    { key: 'actualPaymentDate', label: t('actual_payment_date'), type: 'date' },
    { key: 'paymentMethod', label: t('payment_method'), type: 'select', options: PAYMENT_METHODS_KEYS.map(k => ({ id: t(k), name: t(k) })) },
    { key: 'notes', label: t('description'), type: 'textarea' }
  ];

  const inventoryFields = [
    { key: 'type', label: t('item_type'), type: 'select', options: INVENTORY_TYPES_KEYS.map(k => ({ id: t(k), name: t(k) })) },
    { key: 'modelDetails', label: t('model_details'), placeholder: 'לדוגמה: LG 500 ליטר...' },
    { key: 'purchaseDate', label: t('purchase_date'), type: 'date' },
    { key: 'cost', label: t('item_cost'), type: 'number' },
    { key: 'store', label: t('store'), placeholder: 'מחסני חשמל...' },
    { key: 'serviceName', label: t('service_name') },
    { key: 'servicePhone', label: t('service_phone'), type: 'tel' },
    { key: 'notes', label: t('notes'), type: 'textarea' }
  ];

  const filteredExpenses = expenses.filter(e => {
    if (expenseFilterType && e.type !== expenseFilterType) return false;
    const dateVal = e.paymentDate || e.actualPaymentDate || (e.monthFrom ? e.monthFrom + '-01' : null) || (e.month ? e.month + '-01' : null);
    if (dateVal) {
      const eDate = new Date(dateVal);
      if (expenseFilterFrom && eDate < new Date(expenseFilterFrom)) return false;
      if (expenseFilterTo) {
        const toDate = new Date(expenseFilterTo);
        toDate.setHours(23, 59, 59, 999);
        if (eDate > toDate) return false;
      }
    } else if (expenseFilterFrom || expenseFilterTo) {
      return false;
    }
    return true;
  });

  const filteredExpensesTotal = convertVal(filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0));

  const filteredInventory = inventory.filter(i => {
    if (inventoryFilterType && i.type !== inventoryFilterType) return false;
    if (i.purchaseDate) {
      const pDate = new Date(i.purchaseDate);
      if (inventoryFilterFrom && pDate < new Date(inventoryFilterFrom)) return false;
      if (inventoryFilterTo) {
        const toDate = new Date(inventoryFilterTo);
        toDate.setHours(23, 59, 59, 999);
        if (pDate > toDate) return false;
      }
    } else if (inventoryFilterFrom || inventoryFilterTo) {
      return false;
    }
    return true;
  });

  const filteredInventoryTotal = convertVal(filteredInventory.reduce((sum, i) => sum + Number(i.cost || 0), 0));

  const currentYear = new Date().getFullYear();
  const getCurrentRent = () => {
    if (apt.isCpiLinked) {
      const res = calculateCpiLinkedRent(
        Number(apt.baseRentAmount || apt.targetRent || 0),
        Number(apt.baseCpiYear || 2024),
        Number(apt.baseCpiMonth || 1),
        new Date(),
        cpiHistory,
        cpiType as 'cpi' | 'construction'
      );
      return res.adjustedRent;
    }
    const segments = apt.rentSegments || [];
    const currentMonthNum = new Date().getMonth() + 1; // 1 to 12
    const matchingSegment = segments.find(s => currentMonthNum >= s.fromMonth && currentMonthNum <= s.toMonth);
    return matchingSegment ? Number(matchingSegment.amount) : (Number(apt.targetRent) || 0);
  };
  const monthlyRent = convertVal(getCurrentRent());
  const sizeSqm = Number(apt.size) || 0;
  const pricePerSqm = convertVal(Number(apt.pricePerSqm) || 0);
  const taxableRent = convertVal(Number(apt.taxableRent) || getCurrentRent());
  const taxPercent = Number(apt.taxPercent) || 0;

  const monthlyTax = (taxableRent * taxPercent) / 100;
  const monthlyNetRent = monthlyRent - monthlyTax;
  const annualNetIncome = monthlyNetRent * 12;

  const rentPerSqm = sizeSqm > 0 ? Math.round((showTax ? monthlyNetRent : monthlyRent) / sizeSqm) : 0;
  const propertyValue = sizeSqm * pricePerSqm;
  const annualYield = propertyValue > 0 ? ((showTax ? annualNetIncome : (monthlyRent * 12)) / propertyValue) * 100 : 0;

  const paymentsYTD = convertVal(payments.filter(p => new Date(p.date).getFullYear() === currentYear).reduce((sum, p) => sum + Number(p.amount || 0), 0));
  const repairsYTD = convertVal(repairs.filter(r => new Date(r.date).getFullYear() === currentYear).reduce((sum, r) => sum + Number(r.cost || 0), 0));

  const operatingExpensesYTD = convertVal(expenses.filter(e => {
    if (e.type === 'mortgage') return false;
    if (['hoa', 'arnona'].includes(e.type) && e.isPaid === 'false') return false;
    const d = e.paymentDate || e.actualPaymentDate || (e.monthFrom ? e.monthFrom + '-01' : null) || (e.month ? e.month + '-01' : null) || e.createdAt;
    return d && new Date(d as any).getFullYear() === currentYear;
  }).reduce((sum, e) => sum + Number(e.amount || 0), 0));

  const mortgageExpensesYTD = convertVal(expenses.filter(e => {
    if (e.type !== 'mortgage') return false;
    if (e.isPaid === 'false') return false;
    const d = e.paymentDate || e.actualPaymentDate || e.createdAt;
    return d && new Date(d as any).getFullYear() === currentYear;
  }).reduce((sum, e) => sum + Number(e.amount || 0), 0));

  const expensesByCategory = expenses.filter(e => {
    if (e.type === 'mortgage') return false;
    if (['hoa', 'arnona'].includes(e.type) && e.isPaid === 'false') return false;
    const d = e.paymentDate || e.actualPaymentDate || (e.monthFrom ? e.monthFrom + '-01' : null) || (e.month ? e.month + '-01' : null) || e.createdAt;
    return d && new Date(d as any).getFullYear() === currentYear;
  }).reduce((acc: any, e) => {
    acc[e.type] = (acc[e.type] || 0) + Number(e.amount || 0);
    return acc;
  }, {});

  const collectedRatio = monthlyRent > 0 ? (paymentsYTD / monthlyRent) : 0;
  const taxPaidYTD = monthlyTax * collectedRatio;

  const noiYTD = paymentsYTD - repairsYTD - operatingExpensesYTD;
  const noiYTDAfterTax = noiYTD - taxPaidYTD;

  const cashFlowYTD = noiYTD - mortgageExpensesYTD;
  const cashFlowYTDAfterTax = noiYTDAfterTax - mortgageExpensesYTD;

  const displayNoiYTD = showTax ? noiYTDAfterTax : noiYTD;
  const displayCashFlowYTD = showTax ? cashFlowYTDAfterTax : cashFlowYTD;
  const displayMonthlyRent = showTax ? monthlyNetRent : monthlyRent;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-start">
      {/* Floating Warning Notice Toast */}
      {showWarningNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-amber-500 text-white font-extrabold p-4 rounded-3xl shadow-xl flex items-start gap-3 border border-amber-400">
            <div className="shrink-0 p-1.5 bg-white/20 rounded-xl mt-0.5">
              <LucideIcon name="ShieldAlert" size={18} />
            </div>
            <div className="flex-1 text-xs leading-relaxed text-right">
              {lang === 'he' ? (
                <span>שים לב: האחריות לשמירת המסמכים וגיבויים היא באחריות המשתמש בלבד. מומלץ לשמור עותקי גיבוי מחוץ לאפליקציה. לפרטים נוספים, עיין בתנאי השימוש.</span>
              ) : (
                <span>Please note: Responsibility for document storage and backups lies solely with the user. It is recommended to keep backup copies outside the app. For more details, see the Terms of Use.</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:translate-x-1 transition-transform mb-2">
          <LucideIcon name="ArrowRight" size={20} className="rtl:rotate-0 ltr:rotate-180" />
          <span>{t('dashboard')}</span>
        </button>
        <div className="flex gap-2">
          {onEditRentSegments && (
            <button
              onClick={() => onEditRentSegments(apt)}
              className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
              title={lang === 'he' ? 'עדכון אירועי שכירות' : 'Edit Rent Events'}
            >
              <LucideIcon name="Zap" size={12} />
              <span>{lang === 'he' ? 'אירועי שכירות' : 'Rent Events'}</span>
            </button>
          )}
          {!isTenant && (
            <button
              onClick={() => setShowTax(!showTax)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${showTax ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              {t('toggle_tax_view')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-7 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 dark:bg-indigo-950/20 rounded-full opacity-50 blur-3xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 p-2 rounded-xl"><LucideIcon name={apt.icon || 'Home'} size={20} /></div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                  {apt.name}
                  {isTenant && <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-full">{t('tenant')}</span>}
                </h2>
              </div>
              <div className="text-sm font-medium text-slate-400 dark:text-slate-300 mr-1">{sizeSqm ? `${sizeSqm} מ"ר ` : ''} • {apt.address}</div>
            </div>
            {!isTenant && rentPerSqm > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-2xl text-center shadow-sm">
                <div className="text-[10px] font-bold text-indigo-400 dark:text-indigo-500 uppercase tracking-wide">{t('yield_sqm')}</div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">{cur}{rentPerSqm}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
            {!isTenant ? (
              <>
                {/* 1. Operating Income (NOI) */}
                <div className={`p-3 sm:p-4 rounded-3xl border text-center flex flex-col justify-center min-h-[85px] sm:min-h-[90px] overflow-hidden ${displayNoiYTD >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40' : 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40'}`}>
                  <div className={`text-[9px] sm:text-[10px] font-black mb-1 uppercase tracking-wider truncate ${displayNoiYTD >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`} title={showTax ? t('net_income_after_tax') : t('operating_income')}>
                    {showTax ? t('net_income_after_tax') : t('operating_income')}
                  </div>
                  <div className={`text-sm sm:text-base md:text-lg font-black truncate ${displayNoiYTD >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`} title={`${displayNoiYTD < 0 ? '-' : ''}${cur}${Math.abs(displayNoiYTD).toLocaleString()}`}>
                    {displayNoiYTD < 0 ? '-' : ''}{cur}{Math.abs(displayNoiYTD).toLocaleString()}
                  </div>
                </div>

                {/* 2. Monthly Rent */}
                <div className="bg-slate-50 dark:bg-slate-750 p-3 sm:p-4 rounded-3xl border border-slate-100 dark:border-slate-700 text-center flex flex-col justify-center min-h-[85px] sm:min-h-[90px] overflow-hidden">
                  <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-300 font-black mb-1 uppercase tracking-wider truncate" title={t('rent_monthly')}>{t('rent_monthly')}</div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-slate-700 dark:text-white truncate" title={`${cur}${displayMonthlyRent.toLocaleString()}`}>
                    {cur}{displayMonthlyRent.toLocaleString()}
                  </div>
                  {apt.isCpiLinked && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-center gap-0.5">
                      <LucideIcon name="Scale" size={10} />
                      <span>{lang === 'he' ? 'צמוד מדד' : 'CPI Linked'}</span>
                    </span>
                  )}
                </div>

                {/* 3. Annual Yield */}
                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 sm:p-4 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 text-center flex flex-col justify-center min-h-[85px] sm:min-h-[90px] overflow-hidden">
                  <div className="text-[9px] sm:text-[10px] text-indigo-500 dark:text-indigo-400 font-black mb-1 uppercase tracking-wider truncate" title={t('annual_yield')}>{t('annual_yield')}</div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-indigo-700 dark:text-indigo-400 truncate" title={`${annualYield.toFixed(2)}%`}>
                    {annualYield.toFixed(2)}%
                  </div>
                </div>

                {/* 4. Cash Flow (YTD) */}
                <div className={`p-3 sm:p-4 rounded-3xl border text-center flex flex-col justify-center min-h-[85px] sm:min-h-[90px] overflow-hidden ${displayCashFlowYTD >= 0 ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40' : 'bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40'}`}>
                  <div className={`text-[9px] sm:text-[10px] font-black mb-1 uppercase tracking-wider truncate ${displayCashFlowYTD >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-455'}`} title={t('cash_flow_ytd')}>{t('cash_flow_ytd')}</div>
                  <div className={`text-sm sm:text-base md:text-lg font-black truncate ${displayCashFlowYTD >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`} title={`${displayCashFlowYTD < 0 ? '-' : ''}${cur}${Math.abs(displayCashFlowYTD).toLocaleString()}`}>
                    {displayCashFlowYTD < 0 ? '-' : ''}{cur}{Math.abs(displayCashFlowYTD).toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-50 dark:bg-slate-750 p-3 sm:p-4 rounded-3xl border border-slate-100 dark:border-slate-700 text-center flex flex-col justify-center min-h-[85px] sm:min-h-[90px] overflow-hidden">
                  <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-300 font-black mb-1 uppercase tracking-wider truncate" title={t('rent_monthly')}>{t('rent_monthly')}</div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-slate-700 dark:text-white truncate" title={`${cur}${displayMonthlyRent.toLocaleString()}`}>{cur}{displayMonthlyRent.toLocaleString()}</div>
                  {apt.isCpiLinked && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center justify-center gap-0.5">
                      <LucideIcon name="Scale" size={10} />
                      <span>{lang === 'he' ? 'צמוד מדד' : 'CPI Linked'}</span>
                    </span>
                  )}
                </div>
                <div className="bg-rose-50 dark:bg-rose-950/20 p-3 sm:p-4 rounded-3xl border border-rose-100 dark:border-rose-900/40 text-center flex flex-col justify-center min-h-[85px] sm:min-h-[90px] overflow-hidden">
                  <div className="text-[9px] sm:text-[10px] text-rose-400 dark:text-rose-450 font-black mb-1 uppercase tracking-wider truncate" title={t('total_expenses')}>{t('total_expenses')}</div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-rose-700 dark:text-rose-400 truncate" title={`${cur}${operatingExpensesYTD.toLocaleString()}`}>{cur}{operatingExpensesYTD.toLocaleString()}</div>
                </div>
              </>
            )}
          </div>

          {/* Detailed CPI Linkage Banner */}
          {apt.isCpiLinked && (() => {
            const res = calculateCpiLinkedRent(
              Number(apt.baseRentAmount || apt.targetRent || 0),
              Number(apt.baseCpiYear || 2024),
              Number(apt.baseCpiMonth || 1),
              new Date(),
              cpiHistory || [],
              cpiType as 'cpi' | 'construction'
            );
            const monthNamesHeLocal = [
              'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
              'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
            ];
            const monthNamesEnLocal = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return (
              <div className="mb-6 p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-start">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-black text-sm">
                    <LucideIcon name="Scale" size={16} />
                    <span>
                      {cpiType === 'construction'
                        ? (lang === 'he' ? 'מידע על הצמדה למדד תשומות הבנייה למגורים' : 'Construction Inputs Index Linkage')
                        : (lang === 'he' ? 'מידע על הצמדה למדד המחירים לצרכן' : 'Consumer Price Index Linkage')
                      }
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-bold">
                    {lang === 'he' ? (
                      <>
                        שכירות בסיס (קרן): ₪{(Number(apt.baseRentAmount) || Number(apt.targetRent) || 0).toLocaleString()} · 
                        מדד בסיס ({monthNamesHeLocal[Number(apt.baseCpiMonth || 1) - 1]} {apt.baseCpiYear || 2024}): {res.baseIndex} נק׳
                      </>
                    ) : (
                      <>
                        Base Rent (Principal): ₪{(Number(apt.baseRentAmount) || Number(apt.targetRent) || 0).toLocaleString()} · 
                        Base Index ({monthNamesEnLocal[Number(apt.baseCpiMonth || 1) - 1]} {apt.baseCpiYear || 2024}): {res.baseIndex} pts
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {lang === 'he' ? (
                      <>
                        המדד הידוע האחרון: {res.targetIndex} נק׳ ({monthNamesHeLocal[res.targetMonth - 1]} {res.targetYear})
                      </>
                    ) : (
                      <>
                        Latest known index: {res.targetIndex} pts ({monthNamesEnLocal[res.targetMonth - 1]} {res.targetYear})
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-start sm:items-end gap-0.5 shrink-0">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${res.changePercent >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'}`}>
                    {res.changePercent >= 0 ? '+' : ''}{res.changePercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {lang === 'he' ? 'שינוי מצטבר במדד' : 'Accumulated CPI change'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Mortgage Card Section */}
          {!isTenant && mortgages.length > 0 && (
            <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 rounded-[2rem]">
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-black text-base">
                  <div className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-xl">
                    <LucideIcon name="Landmark" size={16} />
                  </div>
                  <span>{lang === 'he' ? 'משכנתא' : 'Mortgage'}</span>
                </div>
                <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm">
                  {lang === 'he' ? 'שולם השנה' : 'Paid This Year'}: {cur}{mortgageExpensesYTD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="grid gap-3">
                {mortgages.map(m => (
                  <div key={m.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="text-start">
                      <div className="font-black text-base text-slate-800 dark:text-white">{m.bank}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-300 font-bold mt-1">
                        {lang === 'he' ? 'סכום יתרה' : 'Current Balance'}: {cur}{convertVal(Number(m.balance || 0)).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 text-right">
                        <span className="font-black text-base text-indigo-600 dark:text-indigo-400">{cur}{convertVal(Number(m.payment || 0)).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 block text-right mt-0.5">/ {lang === 'he' ? 'חודש' : 'month'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setNewExpenseTemplate({ type: 'mortgage', mortgageId: m.id, amount: m.payment });
                          setShowForm(true);
                        }}
                        className="mt-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shadow-sm border border-indigo-100/20"
                      >
                        <LucideIcon name="Plus" size={10} />
                        <span>{lang === 'he' ? 'תעד תשלום' : 'Record Payment'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-2xl overflow-x-auto hide-scrollbar gap-1.5">
            {['summary', 'income', 'repairs', 'expenses', 'inventory', 'documents'].map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap border ${
                  view === v 
                    ? 'bg-white dark:bg-slate-800 shadow-[0_4px_12px_rgba(99,102,241,0.15)] text-indigo-600 dark:text-indigo-455 border-indigo-200 dark:border-indigo-900/60 transform scale-[1.05] font-black' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-transparent'
                }`}
              >
                {v === 'documents' ? (lang === 'he' ? 'מסמכים' : 'Documents') : t(v === 'income' ? 'payments' : v === 'repairs' ? 'repairs' : v === 'expenses' ? 'expenses' : v === 'inventory' ? 'inventory' : 'summary')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view !== 'summary' && (
        <div className="flex justify-between items-center px-3 gap-2 flex-wrap">
          <h3 className="font-bold text-xl text-slate-800 dark:text-white">
            {view === 'documents' ? (lang === 'he' ? 'מסמכים דיגיטליים' : 'Digital Documents') : view === 'income' ? t('history_payments') : view === 'repairs' ? t('repair_log') : view === 'inventory' ? t('inventory') : t('expenses')}
          </h3>
          <div className="flex items-center gap-2">
            {view === 'documents' && (
              <button
                onClick={() => setShowTermsModal(true)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                title={lang === 'he' ? 'קרא תנאי שימוש והצהרת גיבוי' : 'Read Terms of Use & Backup Disclaimer'}
              >
                <LucideIcon name="ShieldAlert" size={16} />
                <span>{lang === 'he' ? 'תנאי שימוש' : 'Terms of Use'}</span>
              </button>
            )}
            <button 
              onClick={() => { 
                if (view === 'documents') {
                  setEditingDoc(null);
                  setShowDocModal(true);
                } else {
                  setNewExpenseTemplate(null); 
                  setShowForm(true); 
                }
              }} 
              className="bg-indigo-600 text-white flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors"
            >
              <LucideIcon name="Plus" size={18} />
              <span>
                {view === 'documents' ? (lang === 'he' ? 'הוסף מסמך' : 'Add Document') : t(view === 'income' ? 'add_payment' : view === 'repairs' ? 'add_repair' : view === 'inventory' ? 'add_inventory' : 'add_expense')}
              </span>
            </button>
          </div>
        </div>
      )}

       {showForm && (
        (view === 'expenses' || (newExpenseTemplate && newExpenseTemplate.type === 'mortgage')) ? (
          <ExpenseModal
            initialData={newExpenseTemplate}
            isTenant={isTenant}
            onSave={(data, id) => {
              if (data.type === 'mortgage' && data.newBalance && data.mortgageId) {
                onSaveMortgage({
                  balance: data.newBalance,
                  balanceDate: data.newBalanceDate || data.actualPaymentDate || data.paymentDate || new Date().toISOString().split('T')[0]
                }, data.mortgageId);
              }
              onSaveExpense(data, id);
              setShowForm(false);
              setNewExpenseTemplate(null);
            }}
            onCancel={() => { setShowForm(false); setNewExpenseTemplate(null); }}
            t={t}
          />
        ) : view === 'inventory' ? (
          <ModalForm
            title={t('add_inventory')}
            fields={inventoryFields}
            initialData={{ purchaseDate: new Date().toISOString().split('T')[0] }}
            onSave={(data) => { onSaveInventory(data); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
            t={t}
          />
        ) : view === 'income' ? (
          <ModalForm
            title={t('add_new')}
            fields={paymentFields}
            initialData={{ amount: String(apt.targetRent || ''), date: new Date().toISOString().split('T')[0] }}
            onSave={(d) => { onSavePayment(d); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
            t={t}
          />
        ) : (
          <ModalForm
            title={t('add_new')}
            fields={repairFields}
            initialData={{ date: new Date().toISOString().split('T')[0] }}
            onSave={(d) => { onSaveRepair(d); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
            t={t}
          />
        )
      )}

      {/* Sub Views list details */}
      {view === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-black text-xl text-slate-800 dark:text-white mb-5">{t('financial_summary')}</h3>
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-slate-500 dark:text-slate-400">{t('total_income')}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cur}{paymentsYTD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-slate-500 dark:text-slate-400">{t('total_repairs')}</span>
                <span className="text-orange-600 dark:text-orange-400 font-bold">{cur}{repairsYTD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="text-slate-500 dark:text-slate-400">{t('total_expenses')}</span>
                <span className="text-rose-600 dark:text-rose-455 font-bold">{cur}{operatingExpensesYTD.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Category-by-category expense summary */}
          {Object.keys(expensesByCategory).length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <h3 className="font-black text-base text-slate-800 dark:text-white mb-4">
                {lang === 'he' ? 'פירוט הוצאות לפי קטגוריות השנה' : 'Expense Breakdown by Category'}
              </h3>
              <div className="space-y-4 text-xs font-semibold">
                {Object.entries(expensesByCategory).map(([cat, amt]) => {
                  const percentage = operatingExpensesYTD > 0 ? (Number(amt) / operatingExpensesYTD) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0"></span>
                          <span className="font-bold">{t(cat) || cat}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({percentage.toFixed(0)}%)</span>
                        </div>
                        <span className="text-slate-800 dark:text-slate-200 font-black">{cur}{Number(amt).toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-750 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-rose-500 dark:bg-rose-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List items with editing inline modals */}
      {view === 'income' && [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
        <div key={p.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col gap-3 shadow-sm border border-slate-100 dark:border-slate-700 text-start">
          {/* Row 1: Title + Icon (Right/Start) & Amount + Buttons (Left/End) */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-2xl shrink-0 flex items-center justify-center">
                <LucideIcon name="Coins" size={18} />
              </div>
              <span className="font-black text-base text-slate-800 dark:text-white">
                {lang === 'he' ? 'דמי שכירות' : 'Rent Payment'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg text-emerald-600 dark:text-emerald-455 mr-2">
                {cur}{Number(p.amount).toLocaleString()}
              </span>
              <button 
                onClick={() => setEditingPayment(p)} 
                className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-transform"
                title={t('edit')}
              >
                <LucideIcon name="Pencil" size={14} />
              </button>
              <button 
                onClick={() => confirm(t('confirm_delete') || 'Delete?') && onDeletePayment(p.id)} 
                className="p-2 bg-rose-50 dark:bg-rose-950/10 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                title={t('confirm_delete')}
              >
                <LucideIcon name="Trash2" size={14} />
              </button>
            </div>
          </div>

          {/* Row 2: Gray Info Pills (Payment Date, Payment Method) */}
          <div className="flex flex-wrap justify-start gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            {p.date && (
              <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                {lang === 'he' ? `תאריך קבלה: ${new Date(p.date).toLocaleDateString('he-IL')}` : `Received Date: ${new Date(p.date).toLocaleDateString()}`}
              </span>
            )}
            {p.paymentMethod && (
              <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                {p.paymentMethod}
              </span>
            )}
          </div>

          {/* Row 3: Notes (Full Width light banner) */}
          {p.notes && (
            <div className="w-full bg-slate-50/70 dark:bg-slate-755/50 p-3 rounded-2xl text-xs text-slate-600 dark:text-slate-350 text-start font-medium border border-slate-100/50 dark:border-slate-700/30">
              {p.notes}
            </div>
          )}
        </div>
      ))}

      {view === 'repairs' && [...repairs].sort((a, b) => {
        const dateA = new Date(a.actualPaymentDate || a.date).getTime();
        const dateB = new Date(b.actualPaymentDate || b.date).getTime();
        return dateB - dateA;
      }).map(r => {
        const getRepairIconName = (typeStr: string) => {
          const lower = (typeStr || '').toLowerCase();
          if (lower.includes('חשמל') || lower.includes('electric')) return 'Zap';
          if (lower.includes('אינסטל') || lower.includes('ביוב') || lower.includes('plumb') || lower.includes('מים')) return 'Droplets';
          if (lower.includes('שמש') || lower.includes('דוד') || lower.includes('solar')) return 'Sun';
          if (lower.includes('מזגן') || lower.includes('מיזוג') || lower.includes('ac') || lower.includes('air')) return 'Wind';
          if (lower.includes('צבע') || lower.includes('paint')) return 'Paintbrush';
          if (lower.includes('הדברה') || lower.includes('pest')) return 'Bug';
          if (lower.includes('שיפוץ') || lower.includes('renov')) return 'Hammer';
          return 'Wrench';
        };

        return (
          <div key={r.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col gap-3 shadow-sm border border-slate-100 dark:border-slate-700 text-start">
            {/* Row 1: Title + Icon (Right/Start) & Cost + Buttons (Left/End) */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-orange-50 dark:bg-orange-950/20 text-orange-500 rounded-2xl shrink-0 flex items-center justify-center">
                  <LucideIcon name={getRepairIconName(r.type)} size={18} />
                </div>
                <span className="font-black text-base text-slate-800 dark:text-white">{r.type}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-orange-600 dark:text-orange-455 ml-2">
                  {cur}{Number(r.cost).toLocaleString()}
                </span>
                <button 
                  onClick={() => setEditingRepair(r)} 
                  className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-transform"
                  title={t('edit')}
                >
                  <LucideIcon name="Pencil" size={14} />
                </button>
                <button 
                  onClick={() => confirm(t('confirm_delete') || 'Delete?') && onDeleteRepair(r.id)} 
                  className="p-2 bg-rose-50 dark:bg-rose-950/10 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                  title={t('confirm_delete')}
                >
                  <LucideIcon name="Trash2" size={14} />
                </button>
              </div>
            </div>

            {/* Row 2: Gray Info Pills (Payment Date, Provider, Method) */}
            <div className="flex flex-wrap justify-start gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {r.actualPaymentDate ? (
                <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                  {lang === 'he' ? `תאריך תשלום בפועל: ${new Date(r.actualPaymentDate).toLocaleDateString('he-IL')}` : `Actual Payment Date: ${new Date(r.actualPaymentDate).toLocaleDateString()}`}
                </span>
              ) : r.date ? (
                <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                  {lang === 'he' ? `תאריך עבודה: ${new Date(r.date).toLocaleDateString('he-IL')}` : `Work Date: ${new Date(r.date).toLocaleDateString()}`}
                </span>
              ) : null}
              {r.providerName && (
                <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <LucideIcon name="User" size={10} />
                  <span>{r.providerName}</span>
                </span>
              )}
              {r.paymentMethod && (
                <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                  {r.paymentMethod}
                </span>
              )}
            </div>

            {/* Row 3: Notes (Full Width light banner) */}
            {r.notes && (
              <div className="w-full bg-slate-50/70 dark:bg-slate-755/50 p-3 rounded-2xl text-xs text-slate-600 dark:text-slate-350 text-start font-medium border border-slate-100/50 dark:border-slate-700/30">
                {r.notes}
              </div>
            )}
          </div>
        );
      })}

      {view === 'expenses' && (
        <div className="space-y-3 w-full">
          {/* Expenses Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-755 p-4 rounded-3xl border border-slate-150 dark:border-slate-700 text-xs space-y-3">
            <div className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <LucideIcon name="Filter" size={14} />
              <span>{t('filter_expenses')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select 
                value={expenseFilterType} 
                onChange={e => setExpenseFilterType(e.target.value)}
                className="bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 font-bold text-slate-700 dark:text-white"
              >
                <option value="">{t('all_types')}</option>
                {['arnona', 'electricity', 'water', 'gas', 'hoa', 'mortgage_payment', 'rent_expense', 'internet', 'insurance', 'cleaning', 'management_fee', 'gardening', 'other_regular', 'professional_services', 'taxes_fees', 'supplies'].map(k => (
                  <option key={k} value={k}>{t(k)}</option>
                ))}
              </select>
              <input 
                type="date" 
                value={expenseFilterFrom} 
                onChange={e => setExpenseFilterFrom(e.target.value)}
                className="bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 font-bold text-slate-700 dark:text-white"
                placeholder={lang === 'he' ? 'מתאריך' : 'From Date'}
              />
              <input 
                type="date" 
                value={expenseFilterTo} 
                onChange={e => setExpenseFilterTo(e.target.value)}
                className="bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 font-bold text-slate-700 dark:text-white"
                placeholder={lang === 'he' ? 'עד תאריך' : 'To Date'}
              />
            </div>
            {(expenseFilterType || expenseFilterFrom || expenseFilterTo) && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-600 dark:text-slate-350">{t('total_filtered')}: <span className="text-rose-650 dark:text-rose-400">{cur}{filteredExpensesTotal.toLocaleString()}</span></span>
                <button 
                  onClick={() => { setExpenseFilterType(''); setExpenseFilterFrom(''); setExpenseFilterTo(''); }}
                  className="text-indigo-650 dark:text-indigo-400 font-bold hover:underline"
                >
                  {t('clear_filters')}
                </button>
              </div>
            )}
          </div>

          {[...filteredExpenses].sort((a, b) => {
            const getExpenseTime = (exp: any) => {
              const dateVal = exp.actualPaymentDate || exp.paymentDate || (exp.monthFrom ? exp.monthFrom + '-01' : null) || (exp.month ? exp.month + '-01' : null);
              if (dateVal) {
                const d = new Date(dateVal);
                return isNaN(d.getTime()) ? 0 : d.getTime();
              }
              return 0;
            };
            return getExpenseTime(b) - getExpenseTime(a);
          }).map(e => {
            const getExpenseIcon = (typeStr: string) => {
              switch (typeStr) {
                case 'electricity': return 'Zap';
                case 'water': return 'Droplets';
                case 'gas': return 'Flame';
                case 'hoa': return 'Users';
                case 'mortgage':
                case 'mortgage_payment': return 'Landmark';
                case 'rent':
                case 'rent_expense': return 'Key';
                case 'internet': return 'Wifi';
                case 'insurance': return 'Shield';
                case 'cleaning': return 'Brush';
                case 'management_fee': return 'Briefcase';
                case 'gardening': return 'Leaf';
                case 'professional_services': return 'Wrench';
                case 'taxes_fees': return 'Receipt';
                case 'supplies': return 'ShoppingBag';
                default: return 'CircleEllipsis';
              }
            };

            return (
              <div key={e.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col gap-3 shadow-sm border border-slate-100 dark:border-slate-700 text-start">
                {/* Row 1: Title + Icon (Right/Start) & Amount + Buttons (Left/End) */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl shrink-0 flex items-center justify-center">
                      <LucideIcon name={getExpenseIcon(e.type)} size={18} />
                    </div>
                    <span className="font-black text-base text-slate-800 dark:text-white">{t(e.type) || e.type}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-lg text-slate-800 dark:text-white mr-2">
                      {cur}{Number(e.amount).toLocaleString()}
                    </span>
                    <button 
                      onClick={() => setEditingExpense(e)} 
                      className="p-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:scale-110 transition-transform"
                      title={t('edit')}
                    >
                      <LucideIcon name="Pencil" size={14} />
                    </button>
                    <button 
                      onClick={() => confirm(t('confirm_delete') || 'Delete?') && onDeleteExpense(e.id)} 
                      className="p-2 bg-rose-50 dark:bg-rose-950/10 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                      title={t('confirm_delete')}
                    >
                      <LucideIcon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>

                {/* Row 2: Status Badge */}
                <div className="flex justify-end -mt-1">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${e.isPaid === 'true' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/20'}`}>
                    {e.isPaid === 'true' ? t('paid') : t('unpaid')}
                  </span>
                </div>

                {/* Row 3: Gray Info Pills (Payment Date, Payment Method, Month) */}
                <div className="flex flex-wrap justify-start gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  {e.isPaid === 'true' && e.actualPaymentDate && (
                    <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                      {lang === 'he' ? `תאריך תשלום בפועל: ${new Date(e.actualPaymentDate).toLocaleDateString('he-IL')}` : `Actual Payment Date: ${new Date(e.actualPaymentDate).toLocaleDateString()}`}
                    </span>
                  )}
                  {e.paymentDate && (!e.actualPaymentDate || e.isPaid !== 'true') && (
                    <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                      {lang === 'he' ? `תאריך תשלום: ${new Date(e.paymentDate).toLocaleDateString('he-IL')}` : `Payment Date: ${new Date(e.paymentDate).toLocaleDateString()}`}
                    </span>
                  )}
                  {e.month && (
                    <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                      {lang === 'he' ? `חודש: ${formatMonthString(e.month)}` : `Month: ${formatMonthString(e.month)}`}
                    </span>
                  )}
                  {e.monthFrom && (
                    <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                      {lang === 'he' ? `תקופה: ${formatMonthString(e.monthFrom)} - ${formatMonthString(e.monthTo)}` : `Period: ${formatMonthString(e.monthFrom)} - ${formatMonthString(e.monthTo)}`}
                    </span>
                  )}
                  {e.paymentMethod && (
                    <span className="bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-xl">
                      {e.paymentMethod}
                    </span>
                  )}
                </div>

                {/* Row 4: Notes (Full Width light banner) */}
                {e.notes && (
                  <div className="w-full bg-slate-50/70 dark:bg-slate-755/50 p-3 rounded-2xl text-xs text-slate-600 dark:text-slate-350 text-start font-medium border border-slate-100/50 dark:border-slate-700/30">
                    {e.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'inventory' && (
        <div className="space-y-4 w-full">
          {/* Inventory Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-755 p-4 rounded-3xl border border-slate-150 dark:border-slate-700 text-xs space-y-3">
            <div className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <LucideIcon name="Filter" size={14} />
              <span>{t('filter_inventory')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select 
                value={inventoryFilterType} 
                onChange={e => setInventoryFilterType(e.target.value)}
                className="bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 font-bold text-slate-700 dark:text-white w-full"
              >
                <option value="">{t('all_types')}</option>
                {INVENTORY_TYPES_KEYS.map(k => (
                  <option key={k} value={t(k)}>{t(k)}</option>
                ))}
              </select>
              <input 
                type="date" 
                value={inventoryFilterFrom} 
                onChange={e => setInventoryFilterFrom(e.target.value)}
                className="bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 font-bold text-slate-700 dark:text-white w-full"
                placeholder={lang === 'he' ? 'מתאריך' : 'From Date'}
              />
              <input 
                type="date" 
                value={inventoryFilterTo} 
                onChange={e => setInventoryFilterTo(e.target.value)}
                className="bg-white dark:bg-slate-800 p-2 rounded-xl border dark:border-slate-600 font-bold text-slate-700 dark:text-white w-full"
                placeholder={lang === 'he' ? 'עד תאריך' : 'To Date'}
              />
            </div>
            {(inventoryFilterType || inventoryFilterFrom || inventoryFilterTo) && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="font-bold text-slate-600 dark:text-slate-350">{t('total_filtered')}: <span className="text-rose-650 dark:text-rose-400">{cur}{(Math.round(filteredInventoryTotal * 100) / 100).toLocaleString()}</span></span>
                <button 
                  onClick={() => { setInventoryFilterType(''); setInventoryFilterFrom(''); setInventoryFilterTo(''); }}
                  className="text-indigo-650 dark:text-indigo-400 font-bold hover:underline"
                >
                  {t('clear_filters')}
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            {[...filteredInventory].sort((a, b) => {
              const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
              const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
              return dateB - dateA;
            }).map(i => {
              const costVal = i.cost ? Number(i.cost) : 0;
              const displayCost = typeof convertVal === 'function' ? convertVal(costVal) : costVal;

              return (
                <div key={i.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700/60 relative text-start space-y-4">
                  {/* Header Row */}
                  <div className="flex justify-between items-start">
                    {/* Actions on left */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => confirm(t('confirm_delete') || 'Delete?') && onDeleteInventory(i.id)} 
                        className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
                        title={lang === 'he' ? 'מחק' : 'Delete'}
                      >
                        <LucideIcon name="Trash2" size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingInventory(i)} 
                        className="p-2.5 bg-slate-50 dark:bg-slate-755 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-sm"
                        title={lang === 'he' ? 'ערוך' : 'Edit'}
                      >
                        <LucideIcon name="Edit2" size={16} />
                      </button>
                    </div>

                    {/* Title and Icon on right */}
                    <div className="flex items-center gap-4 text-start">
                      <div className="text-end">
                        <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{t(i.type) || i.type}</h3>
                        {i.modelDetails && <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">{i.modelDetails}</p>}
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0 flex items-center justify-center shadow-sm">
                        <LucideIcon name={getInventoryIconName(i.type)} size={22} />
                      </div>
                    </div>
                  </div>

                  {/* Inner Card Area */}
                  <div className="bg-slate-50 dark:bg-slate-755 p-5 rounded-3xl border border-slate-100/50 dark:border-slate-700/40 space-y-3.5 relative">
                    <div className="grid grid-cols-2 gap-4 text-start">
                      {/* תאריך רכישה */}
                      <div className="text-end">
                        <div className="text-[10px] text-slate-400 dark:text-slate-300 font-black uppercase tracking-wider">{lang === 'he' ? 'תאריך רכישה' : 'Purchase Date'}</div>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1">
                          {i.purchaseDate ? new Date(i.purchaseDate).toLocaleDateString('he-IL') : '-'}
                        </div>
                      </div>

                      {/* עלות הפריט */}
                      {i.cost && (
                        <div className="text-start">
                          <div className="text-[10px] text-slate-400 dark:text-slate-300 font-black uppercase tracking-wider">{lang === 'he' ? 'עלות הפריט (₪)' : 'Item Cost'}</div>
                          <div className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1">
                            {cur}{(Math.round(displayCost * 100) / 100).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* חנות / ספק */}
                    {i.store && (
                      <div className="text-end border-t border-dashed border-slate-200 dark:border-slate-700/60 pt-2.5">
                        <div className="text-[10px] text-slate-400 dark:text-slate-300 font-black uppercase tracking-wider">{lang === 'he' ? 'חנות / ספק' : 'Store / Supplier'}</div>
                        <div className="text-sm font-black text-slate-750 dark:text-slate-200 mt-1 font-bold">
                          {i.store}
                        </div>
                      </div>
                    )}

                    {/* שם נותן שירות */}
                    {i.serviceName && (
                      <div className="text-end border-t border-dashed border-slate-200 dark:border-slate-700/60 pt-2.5">
                        <div className="text-[10px] text-slate-400 dark:text-slate-300 font-black uppercase tracking-wider">{lang === 'he' ? 'שם נותן שירות (אחריות)' : 'Service Provider (Warranty)'}</div>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1">
                          {i.serviceName}
                        </div>
                      </div>
                    )}

                    {/* Service phone click-to-dial pill on the bottom left */}
                    {i.servicePhone && (
                      <div className="flex justify-start pt-2">
                        <a 
                          href={`tel:${i.servicePhone}`}
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#eafbf0] dark:bg-emerald-950/40 text-[#17a34a] dark:text-emerald-400 rounded-full text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-sm border border-emerald-100/10"
                          title={lang === 'he' ? 'התקשר לשירות' : 'Call Service'}
                        >
                          <span>{i.servicePhone}</span>
                          <LucideIcon name="Phone" size={13} className="fill-[#17a34a] dark:fill-none shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Notes below inner card */}
                  {i.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic text-end pt-1">
                      "{i.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'documents' && (() => {
        const aptDocuments = documents.filter(d => d.aptId === apt.id);
        const filteredDocs = aptDocuments
          .filter(d => docCategoryFilter === 'all' || d.category === docCategoryFilter)
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

        const categories = [
          { key: 'all', labelHe: 'הכל', labelEn: 'All', icon: 'Layers' },
          { key: 'contract', labelHe: 'חוזי שכירות', labelEn: 'Contracts', icon: 'FileText' },
          { key: 'insurance', labelHe: 'ביטוחים', labelEn: 'Insurance', icon: 'ShieldCheck' },
          { key: 'receipt', labelHe: 'קבלות וחשבוניות', labelEn: 'Receipts', icon: 'Receipt' },
          { key: 'other', labelHe: 'שונות', labelEn: 'Other', icon: 'File' }
        ];

        const catLabels: Record<string, { he: string, en: string }> = {
          contract: { he: 'חוזה שכירות', en: 'Rental Contract' },
          insurance: { he: 'פוליסת ביטוח', en: 'Insurance Policy' },
          receipt: { he: 'קבלה / חשבונית', en: 'Receipt / Invoice' },
          other: { he: 'מסמך שונה', en: 'Other Document' }
        };

        const formatSize = (bytes?: number) => {
          if (!bytes) return '';
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

        return (
          <div className="space-y-4">
            {/* Category Filter Horizontal Pills */}
            <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar select-none">
              {categories.map(cat => {
                const isActive = docCategoryFilter === cat.key;
                const count = cat.key === 'all' 
                  ? aptDocuments.length 
                  : aptDocuments.filter(d => d.category === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setDocCategoryFilter(cat.key as any)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 dark:shadow-none font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <LucideIcon name={cat.icon} size={14} />
                    <span>{lang === 'he' ? cat.labelHe : cat.labelEn}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* List */}
            {filteredDocs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-10 text-center border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/40 text-slate-400 rounded-3xl">
                  <LucideIcon name="FolderOpen" size={40} className="stroke-1 text-indigo-500/80" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-slate-800 dark:text-white">
                    {lang === 'he' ? 'אין מסמכים בקטגוריה זו' : 'No documents in this category'}
                  </h4>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 max-w-sm">
                    {lang === 'he' 
                      ? 'שמור כאן עותקים דיגיטליים של חוזים, פוליסות ביטוח וקבלות בצורה דיגיטלית ב-Firebase Storage.' 
                      : 'Store digital copies of leases, policies, and receipts securely in Firebase Storage.'}
                  </p>
                </div>
                <button
                  onClick={() => openAddDoc()}
                  className="mt-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm border border-indigo-100/10"
                >
                  <LucideIcon name="Plus" size={14} />
                  <span>{lang === 'he' ? 'הוסף את המסמך הראשון' : 'Add your first document'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map(d => {
                  const labelObj = catLabels[d.category] || { he: d.category, en: d.category };
                  const labelStr = lang === 'he' ? labelObj.he : labelObj.en;
                  const isTextOnly = !!d.textCopy;

                  return (
                    <div key={d.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between text-start gap-4 hover:shadow-md transition-shadow animate-in fade-in duration-300">
                      <div>
                        {/* Title Row */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${
                              d.category === 'contract' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                              d.category === 'insurance' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                              d.category === 'receipt' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                              'bg-slate-50 dark:bg-slate-950/20 text-slate-550'
                            }`}>
                              <LucideIcon name={
                                d.category === 'contract' ? 'FileText' :
                                d.category === 'insurance' ? 'ShieldCheck' :
                                d.category === 'receipt' ? 'Receipt' : 'File'
                              } size={18} />
                            </div>
                            <div>
                              <div className="font-black text-base text-slate-850 dark:text-white line-clamp-1">{d.title}</div>
                              <div className="text-[10px] font-black text-slate-400 mt-0.5">{labelStr}</div>
                            </div>
                          </div>
                          
                          {d.date && (
                            <span className="text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full whitespace-nowrap">
                              {new Date(d.date).toLocaleDateString('he-IL')}
                            </span>
                          )}
                        </div>

                        {/* Description/Notes */}
                        {d.notes && (
                          <p className="text-xs text-slate-550 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed bg-slate-50/50 dark:bg-slate-755/30 p-2 rounded-xl border border-slate-100/50 dark:border-slate-800/30">
                            {d.notes}
                          </p>
                        )}

                        {/* File Details Tag */}
                        {(d.fileName || d.url) && (
                          <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-450 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100/40 dark:border-slate-800/30 w-fit">
                            <LucideIcon name={isTextOnly ? "BookOpen" : "Paperclip"} size={11} className="text-indigo-500/80" />
                            <span className="truncate max-w-[150px]">{d.fileName || 'document'}</span>
                            {d.fileSize && <span>({formatSize(d.fileSize)})</span>}
                            <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-black">
                              {isTextOnly ? (lang === 'he' ? 'הקלדה מילולית' : 'Text Copy') : (lang === 'he' ? 'קובץ סרוק' : 'File Scan')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-between w-full pt-3 border-t border-slate-50 dark:border-slate-750/50 mt-1">
                        <div className="flex gap-1.5">
                          {/* View button */}
                          <button
                            onClick={() => setPreviewDoc(d)}
                            className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 hover:scale-105"
                          >
                            <LucideIcon name="Eye" size={12} />
                            <span>{lang === 'he' ? 'הצג העתק' : 'View Copy'}</span>
                          </button>
                        </div>

                        <div className="flex gap-1.5">
                          {/* Edit Metadata */}
                          <button 
                            onClick={() => openEditDoc(d)}
                            className="p-1.5 bg-slate-50 dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all hover:scale-110"
                            title={lang === 'he' ? 'ערוך פרטים' : 'Edit details'}
                          >
                            <LucideIcon name="Edit2" size={13} />
                          </button>
                          {/* Delete Document */}
                          <button 
                            onClick={() => {
                              const promptText = lang === 'he' ? 'האם אתה בטוח שברצונך למחוק מסמך זה? פעולה זו תסיר גם את הקובץ מ-Firebase Storage.' : 'Are you sure you want to delete this document? This will also remove the digital copy from Firebase Storage.';
                              if (confirm(promptText)) {
                                onDeleteDocument(d.id, d.storagePath);
                              }
                            }}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl hover:bg-rose-100 transition-all hover:scale-110"
                            title={lang === 'he' ? 'מחק מסמך' : 'Delete Document'}
                          >
                            <LucideIcon name="Trash2" size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Upload and Form Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="document-modal">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-750">
              <h3 className="font-black text-xl text-slate-800 dark:text-white">
                {editingDoc 
                  ? (lang === 'he' ? 'עדכון פרטי מסמך' : 'Update Document') 
                  : (lang === 'he' ? 'הוספת עותק דיגיטלי' : 'Add Digital Copy')}
              </h3>
              <button onClick={() => setShowDocModal(false)} className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 rounded-full hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSaveDoc} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 pl-1 text-start">
              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">{lang === 'he' ? 'כותרת המסמך' : 'Document Title'} *</label>
                <input 
                  type="text"
                  required
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder={lang === 'he' ? 'למשל: חוזה שכירות 2026' : 'e.g., Lease Agreement 2026'}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">{lang === 'he' ? 'קטגוריה' : 'Category'}</label>
                  <select
                    value={docCategory}
                    onChange={e => setDocCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                  >
                    <option value="contract">{lang === 'he' ? 'חוזה שכירות' : 'Lease/Contract'}</option>
                    <option value="insurance">{lang === 'he' ? 'פוליסת ביטוח' : 'Insurance Policy'}</option>
                    <option value="receipt">{lang === 'he' ? 'קבלה / חשבונית' : 'Receipt / Invoice'}</option>
                    <option value="other">{lang === 'he' ? 'שונות' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">{lang === 'he' ? 'תאריך' : 'Date'}</label>
                  <input 
                    type="date"
                    required
                    value={docDate}
                    onChange={e => setDocDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                  />
                </div>
              </div>

              {/* Storage Copy Method */}
              <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-750">
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-2.5">
                  {lang === 'he' ? 'איך תרצה לשמור את העותק הדיגיטלי?' : 'How would you like to store the digital copy?'}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3.5">
                  <button
                    type="button"
                    onClick={() => setDocStorageMethod('text')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      docStorageMethod === 'text' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-black' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
                    }`}
                  >
                    {lang === 'he' ? 'הקלד/הדבק טקסט (ללא קובץ)' : 'Type/Paste Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocStorageMethod('file')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      docStorageMethod === 'file' 
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-black' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-750'
                    }`}
                  >
                    {lang === 'he' ? 'העלאת קובץ (תמונה/PDF)' : 'Upload File/Scan'}
                  </button>
                </div>

                {docStorageMethod === 'text' ? (
                  <div className="space-y-1.5">
                    <textarea
                      value={docTextCopy}
                      onChange={e => setDocTextCopy(e.target.value)}
                      placeholder={lang === 'he' ? 'הקלד או הדבק כאן את פרטי החוזה, סעיפי הביטוח או קבלה מילולית...' : 'Type or paste details of the agreement, policy sections, or verbal receipt notes here...'}
                      rows={5}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {lang === 'he' 
                        ? 'הטקסט יישמר בבטחה ויועלה אוטומטית כקובץ טקסט (.txt) ל-Firebase Storage למקרה שתרצה להורידו.' 
                        : 'The text copy will be securely saved and automatically uploaded as a virtual text file (.txt) to Firebase Storage.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editingDoc && editingDoc.url && !docFile && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-2xl border border-indigo-100/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                        <span className="truncate max-w-[200px]">{editingDoc.fileName || 'Existing File'}</span>
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">{lang === 'he' ? 'קובץ קיים' : 'Existing File'}</span>
                      </div>
                    )}
                    <div className="relative border-2 border-dashed border-slate-250 dark:border-slate-700 rounded-3xl p-5 hover:border-indigo-400 transition-colors flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800">
                      <input 
                        type="file"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setDocFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 text-slate-400 rounded-2xl mb-2.5">
                        <LucideIcon name="UploadCloud" size={24} className="text-indigo-500" />
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        {docFile 
                          ? (lang === 'he' ? `נבחר: ${docFile.name}` : `Selected: ${docFile.name}`)
                          : (lang === 'he' ? 'לחץ לבחירת קובץ או גרור לכאן' : 'Click to select file or drag here')}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">
                        {lang === 'he' ? 'קבלי תמונות, מסמכים או PDF עד 15MB' : 'Supports image files, documents, or PDFs up to 15MB'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">{lang === 'he' ? 'הערות נוספות (אופציונלי)' : 'Additional Notes (Optional)'}</label>
                <textarea 
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  placeholder="..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
              </div>

              {/* Google Drive Option Checkbox */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/30 p-4 rounded-3xl flex items-center justify-between gap-3 text-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <LucideIcon name="Cloud" size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-700 dark:text-slate-350 leading-none mb-1">
                      {lang === 'he' ? 'גבה ל-Google Drive' : 'Backup to Google Drive'}
                    </span>
                    <span className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold leading-normal">
                      {lang === 'he' 
                        ? 'שומר עותק אוטומטי בתיקייה ייעודית בדרייב האישי שלך' 
                        : 'Automatically saves a copy in a dedicated folder in your Google Drive'}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={saveToDriveOnUpload} 
                    onChange={e => setSaveToDriveOnUpload(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Uploading/Saving to Drive Indicator */}
              {isSavingToDriveOnUpload && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-600 dark:text-emerald-400 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                    {lang === 'he' ? 'יוצר תיקייה ומגבה ב-Google Drive שלכם...' : 'Creating folder and backing up to your Google Drive...'}
                  </div>
                </div>
              )}

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-100/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-indigo-600 dark:text-indigo-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                      {lang === 'he' ? 'מעלה את העותק הדיגיטלי ל-Firebase Storage...' : 'Uploading digital copy to Firebase Storage...'}
                    </span>
                    <span>{uploadProgress !== null ? `${uploadProgress}%` : ''}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress || 10}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions Footer inside modal form */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-750">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-5 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-2xl text-sm font-bold transition-all"
                >
                  {lang === 'he' ? 'ביטול' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-100 dark:shadow-none flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <LucideIcon name="Check" size={16} />
                  <span>{lang === 'he' ? 'שמור עותק' : 'Save Copy'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview and Text Reader Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" id="preview-modal">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-750">
              <div className="flex items-center gap-2.5 text-start">
                <div className={`p-2.5 rounded-2xl ${
                  previewDoc.category === 'contract' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' :
                  previewDoc.category === 'insurance' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' :
                  previewDoc.category === 'receipt' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' :
                  'bg-slate-50 dark:bg-slate-950/20 text-slate-600'
                }`}>
                  <LucideIcon name={
                    previewDoc.category === 'contract' ? 'FileText' :
                    previewDoc.category === 'insurance' ? 'ShieldCheck' :
                    previewDoc.category === 'receipt' ? 'Receipt' : 'File'
                  } size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-850 dark:text-white leading-tight">{previewDoc.title}</h3>
                  <p className="text-[10px] text-slate-455 dark:text-slate-400 font-bold mt-0.5">
                    {previewDoc.date && `${lang === 'he' ? 'תאריך מסמך: ' : 'Document Date: '} ${new Date(previewDoc.date).toLocaleDateString('he-IL')}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 rounded-full hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              {/* If notes are available */}
              {previewDoc.notes && (
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-750 text-start">
                  <span className="block text-[10px] font-black text-slate-400 mb-1">{lang === 'he' ? 'הערות מסמך:' : 'Document Notes:'}</span>
                  <p className="text-xs font-bold text-slate-650 dark:text-slate-300 italic">{previewDoc.notes}</p>
                </div>
              )}

              {/* Pasted text copy - render beautifully */}
              {previewDoc.textCopy ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-455 dark:text-slate-400 uppercase tracking-wider">
                      {lang === 'he' ? 'תוכן העותק הדיגיטלי המילולי' : 'Digital Text Copy'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(previewDoc.textCopy || '');
                        setCopierSuccess(true);
                        setTimeout(() => setCopierSuccess(false), 2000);
                      }}
                      className="text-[10px] flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      <LucideIcon name={copierSuccess ? "Check" : "Copy"} size={12} />
                      <span>{copierSuccess ? (lang === 'he' ? 'הועתק!' : 'Copied!') : (lang === 'he' ? 'העתק לקליפבורד' : 'Copy text')}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap bg-slate-950 text-slate-100 p-5 rounded-3xl border border-slate-850 text-start overflow-y-auto max-h-[45vh] shadow-inner select-text">
                    {previewDoc.textCopy}
                  </div>
                </div>
              ) : (
                /* Render file attachment overview / direct preview if image or PDF */
                <div className="space-y-4">
                  {/* Tab switchers if URL is not local fallback */}
                  {previewDoc.url && !previewDoc.url.startsWith('data:') && (
                    <div className="flex border-b border-slate-150 dark:border-slate-750 pb-2 mb-2 overflow-x-auto gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewViewer('direct')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                          previewViewer === 'direct'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                      >
                        {lang === 'he' ? 'תצוגה ישירה' : 'Direct View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewer('google')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                          previewViewer === 'google'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                      >
                        {lang === 'he' ? 'מציג Google Docs' : 'Google Docs Viewer'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewer('microsoft')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                          previewViewer === 'microsoft'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                      >
                        {lang === 'he' ? 'מציג Microsoft Office' : 'MS Office Viewer'}
                      </button>
                    </div>
                  )}

                  {/* Viewer Content rendering */}
                  {previewDoc.url && (
                    <div className="mt-2 text-start">
                      {previewViewer === 'google' ? (
                        <div className="border border-slate-100 dark:border-slate-700/60 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/40 p-1 h-[50vh] flex flex-col relative">
                          <iframe 
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(previewDoc.url)}&embedded=true`} 
                            title={previewDoc.title}
                            className="w-full h-full rounded-2xl border-0 bg-white"
                          />
                        </div>
                      ) : previewViewer === 'microsoft' ? (
                        <div className="border border-slate-100 dark:border-slate-700/60 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/40 p-1 h-[50vh] flex flex-col relative">
                          <iframe 
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewDoc.url)}`} 
                            title={previewDoc.title}
                            className="w-full h-full rounded-2xl border-0 bg-white"
                          />
                        </div>
                      ) : (
                        /* Direct view handling depending on extension */
                        (() => {
                          const fileName = previewDoc.fileName || '';
                          const isImage = !!(fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) || previewDoc.url.includes('image'));
                          const isPdf = !!(fileName.match(/\.pdf$/i) || previewDoc.url.includes('application/pdf') || previewDoc.url.includes('pdf'));
                          const isWord = !!(fileName.match(/\.(docx|doc)$/i) || previewDoc.url.includes('msword') || previewDoc.url.includes('word'));
                          const isExcel = !!(fileName.match(/\.(xlsx|xls|csv)$/i) || previewDoc.url.includes('excel') || previewDoc.url.includes('spreadsheet') || previewDoc.url.includes('csv'));

                          if (isImage) {
                            return (
                              <div className="space-y-3">
                                {/* Image Toolbar */}
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2 rounded-2xl border border-slate-150 dark:border-slate-750 text-start">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">
                                    {lang === 'he' ? 'כלי תמונה' : 'Image Tools'}
                                  </span>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 3))}
                                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl shadow-sm border border-slate-250 dark:border-slate-700 transition-all hover:scale-105"
                                      title={lang === 'he' ? 'הגדל' : 'Zoom In'}
                                    >
                                      <LucideIcon name="ZoomIn" size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.5))}
                                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl shadow-sm border border-slate-250 dark:border-slate-700 transition-all hover:scale-105"
                                      title={lang === 'he' ? 'הקטן' : 'Zoom Out'}
                                    >
                                      <LucideIcon name="ZoomOut" size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setImageRotate(prev => (prev + 90) % 360)}
                                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl shadow-sm border border-slate-250 dark:border-slate-700 transition-all hover:scale-105"
                                      title={lang === 'he' ? 'סובב 90 מעלות' : 'Rotate 90°'}
                                    >
                                      <LucideIcon name="RotateCw" size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setImageZoom(1); setImageRotate(0); }}
                                      className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 rounded-xl shadow-sm border border-slate-250 dark:border-slate-700 transition-all hover:scale-105"
                                      title={lang === 'he' ? 'אפס תצוגה' : 'Reset'}
                                    >
                                      <LucideIcon name="RefreshCw" size={13} />
                                    </button>
                                  </div>
                                </div>
                                <div className="border border-slate-100 dark:border-slate-700/60 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900/60 p-4 h-[40vh] flex justify-center items-center relative">
                                  <div className="w-full h-full flex justify-center items-center overflow-auto">
                                    <img 
                                      src={previewDoc.url} 
                                      alt={previewDoc.title}
                                      referrerPolicy="no-referrer"
                                      style={{ 
                                        transform: `scale(${imageZoom}) rotate(${imageRotate}deg)`, 
                                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                                      }}
                                      className="max-h-full max-w-full rounded-2xl object-contain shadow-md animate-in zoom-in-95 duration-200"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (isPdf) {
                            return (
                              <div className="border border-slate-100 dark:border-slate-700/60 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/40 p-2 h-[50vh] flex flex-col">
                                <iframe 
                                  src={previewDoc.url} 
                                  title={previewDoc.title}
                                  className="w-full h-full rounded-2xl border-0 bg-white"
                                />
                              </div>
                            );
                          }

                          if (isWord) {
                            return (
                              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-8 border border-slate-150 dark:border-slate-750 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-3xl">
                                  <LucideIcon name="FileText" size={40} />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-sm text-slate-850 dark:text-white">
                                    {previewDoc.fileName || (lang === 'he' ? 'מסמך Word' : 'Word Document')}
                                  </p>
                                  {previewDoc.fileSize && <p className="text-[10px] text-slate-450 dark:text-slate-400">{formatSize(previewDoc.fileSize)}</p>}
                                  <p className="text-xs text-slate-500 max-w-md pt-2 leading-relaxed">
                                    {lang === 'he' 
                                      ? 'קבצי Word אינם ניתנים להצגה ישירה בדפדפן. השתמש בלשוניות "מציג Google Docs" או "מציג Microsoft Office" למעלה כדי להציג את המסמך בצורה דיגיטלית מלאה.' 
                                      : 'Word files cannot be displayed directly by the browser. Click on "Google Docs Viewer" or "MS Office Viewer" tab above to view the document in high fidelity.'}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (isExcel) {
                            return (
                              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-8 border border-slate-150 dark:border-slate-750 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-3xl">
                                  <LucideIcon name="FileSpreadsheet" size={40} />
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-sm text-slate-850 dark:text-white">
                                    {previewDoc.fileName || (lang === 'he' ? 'גיליון Excel' : 'Excel Spreadsheet')}
                                  </p>
                                  {previewDoc.fileSize && <p className="text-[10px] text-slate-450 dark:text-slate-400">{formatSize(previewDoc.fileSize)}</p>}
                                  <p className="text-xs text-slate-500 max-w-md pt-2 leading-relaxed">
                                    {lang === 'he' 
                                      ? 'קבצי Excel אינם ניתנים להצגה ישירה בדפדפן. השתמש בלשוניות "מציג Google Docs" או "מציג Microsoft Office" למעלה כדי להציג את המסמך בצורה דיגיטלית מלאה.' 
                                      : 'Excel files cannot be displayed directly by the browser. Click on "Google Docs Viewer" or "MS Office Viewer" tab above to view the document in high fidelity.'}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-10 border border-slate-150 dark:border-slate-750 flex flex-col items-center justify-center gap-4 text-center">
                              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-3xl animate-pulse">
                                <LucideIcon name="File" size={36} />
                              </div>
                              <div>
                                <p className="font-black text-sm text-slate-850 dark:text-white">{previewDoc.fileName || (lang === 'he' ? 'קובץ מצורף' : 'Attachment file')}</p>
                                {previewDoc.fileSize && <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">{formatSize(previewDoc.fileSize)}</p>}
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {previewDoc.url && (
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {/* Only show "Open original" button if not base64 data to avoid browser security blockages */}
                      {!previewDoc.url.startsWith('data:') && (
                        <button
                          onClick={() => window.open(previewDoc.url, '_blank')}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-extrabold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all border border-slate-200 dark:border-slate-650"
                        >
                          <LucideIcon name="ExternalLink" size={14} />
                          <span>{lang === 'he' ? 'פתח בכרטיסייה חדשה' : 'Open in New Tab'}</span>
                        </button>
                      )}

                      {/* Direct browser-triggered download button */}
                      <button
                        onClick={() => downloadFile(previewDoc.url, previewDoc.fileName || 'document')}
                        className="bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md shadow-indigo-100 dark:shadow-none"
                      >
                        <LucideIcon name="Download" size={14} />
                        <span>{lang === 'he' ? 'הורד למחשב' : 'Download to Computer'}</span>
                      </button>

                      {/* Google Drive backup button */}
                      <button
                        onClick={handleSaveToDrive}
                        disabled={isSavingToDrive}
                        className={`font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md text-white ${
                          isSavingToDrive 
                            ? 'bg-emerald-400 cursor-not-allowed animate-pulse' 
                            : saveToDriveSuccess 
                              ? 'bg-emerald-600 hover:bg-emerald-750' 
                              : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100 dark:shadow-none'
                        }`}
                        title={lang === 'he' ? 'שמירה בטוחה ב-Google Drive האישי שלך' : 'Secure backup to your personal Google Drive'}
                      >
                        <LucideIcon name={isSavingToDrive ? 'Loader2' : saveToDriveSuccess ? 'Check' : 'HardDrive'} size={14} className={isSavingToDrive ? 'animate-spin' : ''} />
                        <span>
                          {isSavingToDrive 
                            ? (lang === 'he' ? 'שומר ב-Drive...' : 'Saving to Drive...') 
                            : saveToDriveSuccess 
                              ? (lang === 'he' ? 'נשמר ב-Drive!' : 'Saved to Drive!') 
                              : driveAccessToken 
                                ? (lang === 'he' ? 'שמור ב-Google Drive' : 'Save to Google Drive')
                                : (lang === 'he' ? 'חבר ושמור ב-Drive' : 'Connect & Save to Drive')}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-750 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all"
              >
                {lang === 'he' ? 'סגור' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPayment && (
        <ModalForm title={t('add_payment')} fields={paymentFields} initialData={editingPayment} onSave={(data, id) => { onSavePayment(data, id); setEditingPayment(null); }} onCancel={() => setEditingPayment(null)} t={t} />
      )}

      {editingRepair && (
        <ModalForm title={t('add_repair')} fields={repairFields} initialData={editingRepair} onSave={(data, id) => { onSaveRepair(data, id); setEditingRepair(null); }} onCancel={() => setEditingRepair(null)} t={t} />
      )}

      {editingInventory && (
        <ModalForm title={t('add_inventory')} fields={inventoryFields} initialData={editingInventory} onSave={(data, id) => { onSaveInventory(data, id); setEditingInventory(null); }} onCancel={() => setEditingInventory(null)} t={t} />
      )}

      {editingExpense && (
        <ExpenseModal initialData={editingExpense} isTenant={isTenant} onSave={(data, id) => { onSaveExpense(data, id); setEditingExpense(null); }} onCancel={() => setEditingExpense(null)} t={t} />
      )}

      {/* Terms of Use Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col max-h-[90vh] overflow-hidden text-start">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-150 dark:border-slate-750">
              <h3 className="font-black text-xl text-slate-800 dark:text-white">
                {lang === 'he' ? 'תנאי שימוש והצהרת אחריות' : 'Terms of Use & Disclaimer'}
              </h3>
              <button onClick={() => setShowTermsModal(false)} className="p-2 text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 rounded-full hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                <LucideIcon name="X" size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4 text-sm text-slate-750 dark:text-slate-350 leading-relaxed rtl select-text text-start">
              <p className="font-black text-base text-indigo-600 dark:text-indigo-400 border-b pb-1">
                {lang === 'he' ? 'הצהרת אחריות וגיבוי מסמכים' : 'Liability Disclaimer & Document Backup'}
              </p>
              
              <p className="font-black text-amber-600 dark:text-amber-400">
                {lang === 'he' 
                  ? 'חשוב! מומלץ לשמור עותק גיבוי של כל מסמך או קובץ המועלה לאפליקציה, הן בתיקייה ייעודית במחשב האישי והן באמצעי גיבוי נוסף (כגון כונן חיצוני או עותק מודפס, לפי הצורך).'
                  : 'Important! It is recommended to keep a backup copy of every document or file uploaded to the application, both in a dedicated folder on your personal computer and in an additional backup medium (such as an external drive or a printed copy, as needed).'}
              </p>

              <p>
                {lang === 'he'
                  ? 'האפליקציה מאפשרת העלאה, צפייה והורדה של קבצים מסוגים שונים לצורך נוחות המשתמש. עם זאת, האחריות המלאה לשמירת המסמכים, לגיבויים ולשלמות המידע חלה על המשתמש בלבד.'
                  : 'The application enables uploading, viewing, and downloading files of various types for the user\'s convenience. However, full responsibility for document storage, backup, and data integrity rests solely with the user.'}
              </p>

              <p>
                {lang === 'he'
                  ? 'אין להסתמך על האפליקציה כמקור הגיבוי היחיד של המסמכים. במקרה של תקלה טכנית, אובדן מידע, מחיקת קבצים, תקלה במערכת או כל אירוע אחר העלול לפגוע בזמינותם של הקבצים, לא ניתן להבטיח את שחזורם.'
                  : 'The application should not be relied upon as the sole backup source for documents. In the event of a technical glitch, data loss, file deletion, system malfunction, or any other event that may affect file availability, recovery cannot be guaranteed.'}
              </p>

              <p className="border-t pt-3 font-semibold text-slate-600 dark:text-slate-400">
                {lang === 'he'
                  ? 'בהעלאת קבצים לאפליקציה, המשתמש מאשר כי הוא מודע לאחריותו לשמור עותקי גיבוי עדכניים של המסמכים וכי הוא נושא באחריות הבלעדית לשמירתם.'
                  : 'By uploading files to the application, the user acknowledges that they are aware of their responsibility to maintain up-to-date backup copies of documents and bear sole responsibility for their retention.'}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-150 dark:border-slate-750 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-150/50 hover:scale-105 active:scale-95 transition-all"
              >
                {lang === 'he' ? 'הבנתי, תודה' : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApartmentDetailView;
