import { useEffect, useMemo, useRef, useState } from 'react';
import { createDummyWorkshopSession } from '../../lib/compareWorkshopRepository';
import { supabase } from '../../lib/supabaseClient';
import SidebarNav from './components/SidebarNav';
import UploadSection from './sections/UploadSection';
import SetupSection from './sections/SetupSection';
import SelectSection from './sections/SelectSection';
import UltimateListingSection from './sections/UltimateListingSection';
import PhotographerListingSection from './sections/PhotographerListingSection';
import DeleteConfirmModal from './components/modals/DeleteConfirmModal';
import SetupFullscreenModal from './components/modals/SetupFullscreenModal';
import SelectFullscreenModal from './components/modals/SelectFullscreenModal';
import UltimateFullscreenModal from './components/modals/UltimateFullscreenModal';
import {
  buildPhotoCatalog,
  convertImageForPdf,
  createPhotographerModule,
  getDisplayName,
  getPdfImageType,
  loadImageDimensions,
  sanitizeFileName,
  shuffleWithSeed
} from './lib/helpers';

const menuItems = ['Upload', 'Setup', 'Select', 'Ultimate Listing', 'Listing per photographer'];

function CompareWorkshopPage() {
  const [activeSection, setActiveSection] = useState('Upload');
  const [photographerModules, setPhotographerModules] = useState([createPhotographerModule(0)]);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [uploadedPhotosByPhotographer, setUploadedPhotosByPhotographer] = useState({});
  const [uploadStatusByPhotographer, setUploadStatusByPhotographer] = useState({});
  const [workshopSessionId, setWorkshopSessionId] = useState(() => createDummyWorkshopSession().id);
  const fileInputRefs = useRef({});
  const wscImportInputRef = useRef(null);
  const uploadedPhotosRef = useRef({});

  const [draftTheme, setDraftTheme] = useState('');
  const [draftSelectedPhotoByPhotographer, setDraftSelectedPhotoByPhotographer] = useState({});
  const [confirmedRounds, setConfirmedRounds] = useState([]);
  const [setupPageIndex, setSetupPageIndex] = useState(0);
  const [currentPhotoIndexByPhotographer, setCurrentPhotoIndexByPhotographer] = useState({});
  const [fullscreenPhotographerId, setFullscreenPhotographerId] = useState(null);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);

  const [selectCategoryIndex, setSelectCategoryIndex] = useState(0);
  const [selectPhotoIndexByCategory, setSelectPhotoIndexByCategory] = useState({});
  const [bestPhotoByCategory, setBestPhotoByCategory] = useState({});
  const [isSelectFullscreenOpen, setIsSelectFullscreenOpen] = useState(false);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isUltimateFullscreenOpen, setIsUltimateFullscreenOpen] = useState(false);
  const [ultimateFullscreenIndex, setUltimateFullscreenIndex] = useState(0);

  const [listingPhotographerId, setListingPhotographerId] = useState('');
  const [isDownloadingPhotographerPdf, setIsDownloadingPhotographerPdf] = useState(false);
  const [listingFullscreenIndex, setListingFullscreenIndex] = useState(0);
  const [isListingFullscreenOpen, setIsListingFullscreenOpen] = useState(false);

  const photoCatalog = useMemo(
    () => buildPhotoCatalog(photographerModules, uploadedPhotosByPhotographer),
    [photographerModules, uploadedPhotosByPhotographer]
  );

  const isViewingConfirmedPage = setupPageIndex < confirmedRounds.length;
  const activeRound = isViewingConfirmedPage ? confirmedRounds[setupPageIndex] : null;
  const activeSelectedPhotoByPhotographer = isViewingConfirmedPage
    ? activeRound?.selectedPhotoByPhotographer ?? {}
    : draftSelectedPhotoByPhotographer;
  const activeTheme = isViewingConfirmedPage ? activeRound?.theme ?? '' : draftTheme;

  const hiddenPhotoIds = useMemo(() => {
    const ids = [];

    confirmedRounds.forEach((round, roundIndex) => {
      if (isViewingConfirmedPage && roundIndex === setupPageIndex) {
        return;
      }

      ids.push(...Object.values(round.selectedPhotoByPhotographer));
    });

    return new Set(ids);
  }, [confirmedRounds, isViewingConfirmedPage, setupPageIndex]);

  const availablePhotosByPhotographer = useMemo(() => {
    return photoCatalog.reduce((accumulator, photographer) => {
      accumulator[photographer.photographerId] = photographer.photos.filter((photo) => !hiddenPhotoIds.has(photo.id));
      return accumulator;
    }, {});
  }, [photoCatalog, hiddenPhotoIds]);

  const canConfirmSetup = useMemo(() => {
    if (!photoCatalog.length) {
      return false;
    }

    return photoCatalog.every((photographer) => {
      const availablePhotos = availablePhotosByPhotographer[photographer.photographerId] ?? [];
      if (!availablePhotos.length) {
        return false;
      }

      return Boolean(activeSelectedPhotoByPhotographer[photographer.photographerId]);
    });
  }, [activeSelectedPhotoByPhotographer, availablePhotosByPhotographer, photoCatalog]);

  const photoById = useMemo(() => {
    const entries = {};
    photoCatalog.forEach((photographer) => {
      photographer.photos.forEach((photo) => {
        entries[photo.id] = photo;
      });
    });
    return entries;
  }, [photoCatalog]);

  const photographerNameById = useMemo(() => {
    const entries = {};
    photoCatalog.forEach((photographer) => {
      entries[photographer.photographerId] = photographer.photographerName;
    });
    return entries;
  }, [photoCatalog]);

  const listingPhotographer = useMemo(
    () => photoCatalog.find((photographer) => photographer.photographerId === listingPhotographerId) ?? null,
    [photoCatalog, listingPhotographerId]
  );

  const listingPhotosForPhotographer = useMemo(() => {
    if (!listingPhotographerId) {
      return [];
    }

    return confirmedRounds
      .map((round, roundIndex) => {
        const photoId = round.selectedPhotoByPhotographer[listingPhotographerId];
        if (!photoId) {
          return null;
        }

        const photo = photoById[photoId];
        if (!photo) {
          return null;
        }

        return {
          ...photo,
          theme: round.theme || `Theme ${roundIndex + 1}`
        };
      })
      .filter(Boolean);
  }, [confirmedRounds, listingPhotographerId, photoById]);

  const randomizedSelectPhotosByCategory = useMemo(() => {
    return confirmedRounds.map((round, roundIndex) => {
      const categoryPhotos = Object.entries(round.selectedPhotoByPhotographer)
        .map(([photographerId, photoId]) => {
          const photo = photoById[photoId];
          if (!photo) {
            return null;
          }

          return {
            photographerId,
            photographerName: photographerNameById[photographerId] ?? 'Photographer',
            photoId: photo.id,
            src: photo.src,
            label: photo.label
          };
        })
        .filter(Boolean);

      const seedKey = `${roundIndex}-${round.theme}-${categoryPhotos.map((item) => item.photoId).join('|')}`;
      const shuffledPhotos = shuffleWithSeed(categoryPhotos, seedKey);

      return {
        theme: round.theme || `Theme ${roundIndex + 1}`,
        photos: shuffledPhotos
      };
    });
  }, [confirmedRounds, photoById, photographerNameById]);

  const starredPhotosForListing = useMemo(() => {
    return randomizedSelectPhotosByCategory
      .map((category, categoryIndex) => {
        const selectedPhotoId = bestPhotoByCategory[categoryIndex];
        if (!selectedPhotoId) {
          return null;
        }

        const photo = category.photos.find((item) => item.photoId === selectedPhotoId);
        if (!photo) {
          return null;
        }

        return {
          ...photo,
          theme: category.theme,
          categoryIndex
        };
      })
      .filter(Boolean);
  }, [bestPhotoByCategory, randomizedSelectPhotosByCategory]);

  function updateActiveTheme(value) {
    if (isViewingConfirmedPage) {
      setConfirmedRounds((current) =>
        current.map((round, roundIndex) => (roundIndex === setupPageIndex ? { ...round, theme: value } : round))
      );
      return;
    }

    setDraftTheme(value);
  }

  function updateActiveSelections(updater) {
    if (isViewingConfirmedPage) {
      setConfirmedRounds((current) =>
        current.map((round, roundIndex) => {
          if (roundIndex !== setupPageIndex) {
            return round;
          }

          const nextValue =
            typeof updater === 'function' ? updater(round.selectedPhotoByPhotographer) : updater;

          return { ...round, selectedPhotoByPhotographer: nextValue };
        })
      );
      return;
    }

    setDraftSelectedPhotoByPhotographer((current) =>
      typeof updater === 'function' ? updater(current) : updater
    );
  }

  function setFileInputRef(photographerId, node) {
    if (!node) {
      delete fileInputRefs.current[photographerId];
      return;
    }

    fileInputRefs.current[photographerId] = node;
  }

  function openPhotographerFilePicker(photographerId) {
    fileInputRefs.current[photographerId]?.click();
  }

  async function resolvePhotoSrcFromStoragePath(storagePath, fallbackSrc = null) {
    if (!storagePath || !supabase) {
      return fallbackSrc;
    }

    const { data, error } = await supabase.storage
      .from('workshop-photos')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    return fallbackSrc;
  }

  async function uploadSinglePhoto(photographerId, photographerName, file) {
    const safeFileName = sanitizeFileName(file.name);
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const storagePath = `${workshopSessionId}/${photographerId}/${uniqueId}-${safeFileName}`;
    let imageSrc = null;
    let uploadedToSupabase = false;

    if (supabase) {
      const { error } = await supabase.storage.from('workshop-photos').upload(storagePath, file, {
        upsert: false,
        cacheControl: '3600'
      });

      if (!error) {
        uploadedToSupabase = true;
        const signedUrl = await resolvePhotoSrcFromStoragePath(storagePath);
        if (signedUrl) {
          imageSrc = signedUrl;
        }
      } else {
        console.warn('Supabase upload failed, keeping local photo only:', error.message);
      }
    }

    if (!imageSrc) {
      imageSrc = URL.createObjectURL(file);
    }

    return {
      id: `${photographerId}-photo-${uniqueId}`,
      label: file.name,
      src: imageSrc,
      photographerId,
      photographerName,
      storagePath: uploadedToSupabase ? storagePath : null,
      sourceKind: uploadedToSupabase ? 'supabase' : 'local'
    };
  }

  async function queueUploadPhotos(photographerId, photographerName, files) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) {
      return { uploadedPhotos: [], failedCount: 0 };
    }

    const uploadedPhotos = [];
    let failedCount = 0;
    let nextIndex = 0;
    const workerCount = Math.min(4, imageFiles.length);

    async function worker() {
      while (nextIndex < imageFiles.length) {
        const fileIndex = nextIndex;
        nextIndex += 1;

        try {
          const uploadedPhoto = await uploadSinglePhoto(photographerId, photographerName, imageFiles[fileIndex]);
          uploadedPhotos.push(uploadedPhoto);
        } catch (error) {
          failedCount += 1;
          console.warn('Photo upload worker failed:', error);
        }
      }
    }

    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return { uploadedPhotos, failedCount };
  }

  async function handlePhotographerFiles(photographerId, rawFiles) {
    const files = Array.from(rawFiles ?? []);
    if (!files.length) {
      return;
    }

    const photographer = photographerModules.find((module) => module.id === photographerId);
    const photographerIndex = photographerModules.findIndex((module) => module.id === photographerId);
    const photographerName = photographer
      ? getDisplayName(photographer, Math.max(0, photographerIndex))
      : 'Photographer';

    setUploadStatusByPhotographer((current) => ({
      ...current,
      [photographerId]: `Uploading ${files.length} photo(s)...`
    }));

    const { uploadedPhotos, failedCount } = await queueUploadPhotos(photographerId, photographerName, files);

    setUploadedPhotosByPhotographer((current) => ({
      ...current,
      [photographerId]: [...(current[photographerId] ?? []), ...uploadedPhotos]
    }));

    const uploadedCount = uploadedPhotos.length;
    const supabaseCount = uploadedPhotos.filter((photo) => photo.sourceKind === 'supabase').length;
    const localOnlyCount = uploadedCount - supabaseCount;
    const statusMessage =
      failedCount > 0
        ? `Uploaded ${uploadedCount} photo(s). ${failedCount} failed.`
        : localOnlyCount > 0
          ? `Uploaded ${uploadedCount} photo(s). ${localOnlyCount} saved locally only.`
          : `Uploaded ${uploadedCount} photo(s).`;

    setUploadStatusByPhotographer((current) => ({
      ...current,
      [photographerId]: statusMessage
    }));
  }

  function handleAddPhotographer() {
    setPhotographerModules((current) => [...current, createPhotographerModule(current.length)]);
  }

  function handleNameChange(moduleId, value) {
    setPhotographerModules((current) =>
      current.map((module) => (module.id === moduleId ? { ...module, name: value } : module))
    );
  }

  function openDeleteDialog(moduleId) {
    setPendingDeleteId(moduleId);
  }

  function closeDeleteDialog() {
    setPendingDeleteId(null);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    const photosToDelete = uploadedPhotosByPhotographer[pendingDeleteId] ?? [];
    const storagePaths = photosToDelete.map((photo) => photo.storagePath).filter(Boolean);

    if (supabase && storagePaths.length) {
      const { error } = await supabase.storage.from('workshop-photos').remove(storagePaths);
      if (error) {
        console.warn('Failed to delete some Supabase files:', error.message);
      }
    }

    setUploadedPhotosByPhotographer((current) => {
      const next = { ...current };
      const photosToRemove = next[pendingDeleteId] ?? [];

      photosToRemove.forEach((photo) => {
        if (photo.src.startsWith('blob:')) {
          URL.revokeObjectURL(photo.src);
        }
      });

      delete next[pendingDeleteId];
      return next;
    });

    setUploadStatusByPhotographer((current) => {
      const next = { ...current };
      delete next[pendingDeleteId];
      return next;
    });

    setPhotographerModules((current) => current.filter((module) => module.id !== pendingDeleteId));
    setPendingDeleteId(null);
  }

  function handleDeleteDialogKeyDown(event) {
    if (event.key === 'Escape') {
      closeDeleteDialog();
      return;
    }

    if (event.key === 'Enter') {
      void confirmDelete();
    }
  }

  function movePhoto(photographerId, direction) {
    const availablePhotos = availablePhotosByPhotographer[photographerId] ?? [];
    if (!availablePhotos.length) {
      return;
    }

    setCurrentPhotoIndexByPhotographer((current) => {
      const currentIndex = current[photographerId] ?? 0;
      const nextIndex = (currentIndex + direction + availablePhotos.length) % availablePhotos.length;
      return { ...current, [photographerId]: nextIndex };
    });
  }

  function getCurrentPhoto(photographerId) {
    const availablePhotos = availablePhotosByPhotographer[photographerId] ?? [];
    if (!availablePhotos.length) {
      return null;
    }

    const currentIndex = currentPhotoIndexByPhotographer[photographerId] ?? 0;
    return availablePhotos[Math.min(currentIndex, availablePhotos.length - 1)];
  }

  function confirmCurrentPhoto(photographerId) {
    const currentPhoto = getCurrentPhoto(photographerId);
    if (!currentPhoto) {
      return;
    }

    updateActiveSelections((current) => ({ ...current, [photographerId]: currentPhoto.id }));
  }

  function confirmSetupRound() {
    if (!canConfirmSetup) {
      alert('Please confirm one photo for each photographer before going to next page.');
      return;
    }

    if (isViewingConfirmedPage) {
      alert('Page updated.');
      return;
    }

    const nextRound = {
      theme: activeTheme.trim() || `Theme ${confirmedRounds.length + 1}`,
      selectedPhotoByPhotographer: { ...activeSelectedPhotoByPhotographer }
    };

    const nextRounds = [...confirmedRounds, nextRound];
    setConfirmedRounds(nextRounds);
    setDraftTheme('');
    setDraftSelectedPhotoByPhotographer({});
    setSetupPageIndex(nextRounds.length);
  }

  function goToPreviousSetupPage() {
    setSetupPageIndex((current) => Math.max(0, current - 1));
  }

  function goToNextSetupPage() {
    setSetupPageIndex((current) => Math.min(confirmedRounds.length, current + 1));
  }

  function goToPreviousSelectCategory() {
    setSelectCategoryIndex((current) => Math.max(0, current - 1));
  }

  function goToNextSelectCategory() {
    setSelectCategoryIndex((current) => Math.min(randomizedSelectPhotosByCategory.length - 1, current + 1));
  }

  function moveSelectPhoto(direction) {
    const category = randomizedSelectPhotosByCategory[selectCategoryIndex];
    if (!category || !category.photos.length) {
      return;
    }

    setSelectPhotoIndexByCategory((current) => {
      const currentIndex = current[selectCategoryIndex] ?? 0;
      const nextIndex = (currentIndex + direction + category.photos.length) % category.photos.length;
      return { ...current, [selectCategoryIndex]: nextIndex };
    });
  }

  function getCurrentSelectPhoto() {
    const category = randomizedSelectPhotosByCategory[selectCategoryIndex];
    if (!category || !category.photos.length) {
      return null;
    }

    const currentIndex = selectPhotoIndexByCategory[selectCategoryIndex] ?? 0;
    return category.photos[Math.min(currentIndex, category.photos.length - 1)];
  }

  function toggleBestPhoto() {
    const currentPhoto = getCurrentSelectPhoto();
    if (!currentPhoto) {
      return;
    }

    setBestPhotoByCategory((current) => {
      const selectedPhotoId = current[selectCategoryIndex];
      if (selectedPhotoId === currentPhoto.photoId) {
        const { [selectCategoryIndex]: _, ...rest } = current;
        return rest;
      }

      return { ...current, [selectCategoryIndex]: currentPhoto.photoId };
    });
  }

  function openUltimateFullscreen(index) {
    setUltimateFullscreenIndex(index);
    setIsUltimateFullscreenOpen(true);
  }

  function moveUltimatePhoto(direction) {
    if (!starredPhotosForListing.length) {
      return;
    }

    setUltimateFullscreenIndex((current) => (current + direction + starredPhotosForListing.length) % starredPhotosForListing.length);
  }

  function openListingFullscreen(index) {
    setListingFullscreenIndex(index);
    setIsListingFullscreenOpen(true);
  }

  function moveListingPhoto(direction) {
    const photos = listingPhotosForPhotographer;
    if (!photos.length) {
      return;
    }

    setListingFullscreenIndex((current) => (current + direction + photos.length) % photos.length);
  }

  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function prepareWscPhotosForExport() {
    const prepared = {};

    for (const [photographerId, photos] of Object.entries(uploadedPhotosByPhotographer)) {
      prepared[photographerId] = [];

      for (const photo of photos) {
        const preparedPhoto = { ...photo };

        if (!preparedPhoto.storagePath && preparedPhoto.src?.startsWith('blob:')) {
          try {
            const response = await fetch(preparedPhoto.src);
            const blob = await response.blob();
            preparedPhoto.embeddedDataUrl = await blobToDataUrl(blob);
          } catch (error) {
            console.warn('Failed to embed local blob in WSC export:', error);
          }
        }

        prepared[photographerId].push(preparedPhoto);
      }
    }

    return prepared;
  }

  async function handleExportWsc() {
    const exportPhotos = await prepareWscPhotosForExport();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      workshopSessionId,
      photographerModules,
      uploadedPhotosByPhotographer: exportPhotos,
      confirmedRounds,
      bestPhotoByCategory
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);

    link.href = downloadUrl;
    link.download = `workshop-${datePart}.wsc`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  }

  function handleImportWscClick() {
    wscImportInputRef.current?.click();
  }

  async function handleImportWscFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const rawText = await file.text();
      const data = JSON.parse(rawText);

      if (!data || !Array.isArray(data.photographerModules) || typeof data.uploadedPhotosByPhotographer !== 'object') {
        alert('Invalid WSC file.');
        return;
      }

      const importedPhotosByPhotographer = {};

      for (const [photographerId, photos] of Object.entries(data.uploadedPhotosByPhotographer ?? {})) {
        const safePhotos = Array.isArray(photos) ? photos : [];
        importedPhotosByPhotographer[photographerId] = [];

        for (const photo of safePhotos) {
          let src = null;

          if (photo.storagePath) {
            src = await resolvePhotoSrcFromStoragePath(photo.storagePath, null);
          }

          if (!src && photo.embeddedDataUrl) {
            src = photo.embeddedDataUrl;
          }

          if (!src && photo.src && !photo.src.startsWith('blob:')) {
            src = photo.src;
          }

          if (!src) {
            continue;
          }

          importedPhotosByPhotographer[photographerId].push({
            ...photo,
            src
          });
        }
      }

      setWorkshopSessionId(data.workshopSessionId || createDummyWorkshopSession().id);
      setPhotographerModules(data.photographerModules);
      setUploadedPhotosByPhotographer(importedPhotosByPhotographer);
      setConfirmedRounds(Array.isArray(data.confirmedRounds) ? data.confirmedRounds : []);
      setBestPhotoByCategory(data.bestPhotoByCategory && typeof data.bestPhotoByCategory === 'object' ? data.bestPhotoByCategory : {});
      setDraftTheme('');
      setDraftSelectedPhotoByPhotographer({});
      setSetupPageIndex(0);
      setSelectCategoryIndex(0);
      setCurrentPhotoIndexByPhotographer({});
      setSelectPhotoIndexByCategory({});
      setUploadStatusByPhotographer({});
      setActiveSection('Upload');

      alert('WSC imported successfully.');
    } catch (error) {
      alert('Could not import WSC file.');
    }
  }

  async function handleDownloadPdf() {
    if (!starredPhotosForListing.length) {
      alert('No starred photos yet. Star photos in Select first.');
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const photosPerPage = 2;

      for (let startIndex = 0; startIndex < starredPhotosForListing.length; startIndex += photosPerPage) {
        if (startIndex > 0) {
          pdf.addPage();
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 24;
        const gap = 16;
        const slotHeight = (pageHeight - margin * 2 - gap) / 2;
        const slotWidth = pageWidth - margin * 2;
        const captionHeight = 18;
        const imageSlotHeight = slotHeight - captionHeight;

        for (let offset = 0; offset < photosPerPage; offset += 1) {
          const photoIndex = startIndex + offset;
          if (photoIndex >= starredPhotosForListing.length) {
            break;
          }

          const photo = starredPhotosForListing[photoIndex];
          const safeSrc = await convertImageForPdf(photo.src);
          const { width: imageWidth, height: imageHeight } = await loadImageDimensions(safeSrc);
          const scale = Math.min(slotWidth / imageWidth, imageSlotHeight / imageHeight);
          const drawWidth = imageWidth * scale;
          const drawHeight = imageHeight * scale;
          const x = margin + (slotWidth - drawWidth) / 2;
          const slotTopY = margin + offset * (slotHeight + gap);
          const captionText = `${photo.theme} - ${photo.photographerName}`;

          pdf.setFontSize(11);
          pdf.text(captionText, margin, slotTopY + 12);

          const imageTopY = slotTopY + captionHeight;
          const y = imageTopY + (imageSlotHeight - drawHeight) / 2;

          pdf.addImage(safeSrc, getPdfImageType(safeSrc), x, y, drawWidth, drawHeight);
        }
      }

      pdf.save('efkt-ultimate-listing.pdf');
    } catch (error) {
      alert('Could not generate PDF yet. Install dependencies and try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadPhotographerPdf() {
    if (!listingPhotographer || !listingPhotosForPhotographer.length) {
      alert('No category photos available for this photographer.');
      return;
    }

    setIsDownloadingPhotographerPdf(true);

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const photosPerPage = 2;

      for (let startIndex = 0; startIndex < listingPhotosForPhotographer.length; startIndex += photosPerPage) {
        if (startIndex > 0) {
          pdf.addPage();
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 24;
        const gap = 16;
        const slotHeight = (pageHeight - margin * 2 - gap) / 2;
        const slotWidth = pageWidth - margin * 2;
        const captionHeight = 18;
        const imageSlotHeight = slotHeight - captionHeight;

        for (let offset = 0; offset < photosPerPage; offset += 1) {
          const photoIndex = startIndex + offset;
          if (photoIndex >= listingPhotosForPhotographer.length) {
            break;
          }

          const photo = listingPhotosForPhotographer[photoIndex];
          const safeSrc = await convertImageForPdf(photo.src);
          const { width: imageWidth, height: imageHeight } = await loadImageDimensions(safeSrc);
          const scale = Math.min(slotWidth / imageWidth, imageSlotHeight / imageHeight);
          const drawWidth = imageWidth * scale;
          const drawHeight = imageHeight * scale;
          const x = margin + (slotWidth - drawWidth) / 2;
          const slotTopY = margin + offset * (slotHeight + gap);
          const captionText = `${photo.theme} - ${listingPhotographer.photographerName}`;

          pdf.setFontSize(11);
          pdf.text(captionText, margin, slotTopY + 12);

          const imageTopY = slotTopY + captionHeight;
          const y = imageTopY + (imageSlotHeight - drawHeight) / 2;

          pdf.addImage(safeSrc, getPdfImageType(safeSrc), x, y, drawWidth, drawHeight);
        }
      }

      pdf.save(`listing-${listingPhotographer.photographerName.replaceAll(' ', '-').toLowerCase()}.pdf`);
    } catch (error) {
      alert('Could not generate photographer listing PDF.');
    } finally {
      setIsDownloadingPhotographerPdf(false);
    }
  }

  useEffect(() => {
    uploadedPhotosRef.current = uploadedPhotosByPhotographer;
  }, [uploadedPhotosByPhotographer]);

  useEffect(() => {
    return () => {
      Object.values(uploadedPhotosRef.current)
        .flat()
        .forEach((photo) => {
          if (photo.src?.startsWith('blob:')) {
            URL.revokeObjectURL(photo.src);
          }
        });
    };
  }, []);

  useEffect(() => {
    if (!pendingDeleteId) {
      return undefined;
    }

    function handleWindowKeyDown(event) {
      handleDeleteDialogKeyDown(event);
    }

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [pendingDeleteId]);

  useEffect(() => {
    setCurrentPhotoIndexByPhotographer((current) => {
      const next = {};

      for (const photographer of photoCatalog) {
        const availablePhotos = availablePhotosByPhotographer[photographer.photographerId] ?? [];
        const selectedPhotoId = activeSelectedPhotoByPhotographer[photographer.photographerId];
        const selectedIndex = selectedPhotoId
          ? availablePhotos.findIndex((photo) => photo.id === selectedPhotoId)
          : -1;

        if (selectedIndex >= 0) {
          next[photographer.photographerId] = selectedIndex;
          continue;
        }

        const currentIndex = current[photographer.photographerId] ?? 0;
        next[photographer.photographerId] = Math.max(0, Math.min(currentIndex, availablePhotos.length - 1));
      }

      return next;
    });

    setDraftSelectedPhotoByPhotographer((current) => {
      const next = {};

      for (const [photographerId, selectedPhotoId] of Object.entries(current)) {
        const availablePhotos = availablePhotosByPhotographer[photographerId] ?? [];
        if (availablePhotos.some((photo) => photo.id === selectedPhotoId)) {
          next[photographerId] = selectedPhotoId;
        }
      }

      return next;
    });
  }, [photoCatalog, availablePhotosByPhotographer, activeSelectedPhotoByPhotographer, setupPageIndex]);

  useEffect(() => {
    if (!randomizedSelectPhotosByCategory.length) {
      setSelectCategoryIndex(0);
      return;
    }

    setSelectCategoryIndex((current) => Math.min(current, randomizedSelectPhotosByCategory.length - 1));

    setSelectPhotoIndexByCategory((current) => {
      const next = {};

      randomizedSelectPhotosByCategory.forEach((category, categoryIndex) => {
        const currentIndex = current[categoryIndex] ?? 0;
        next[categoryIndex] = Math.max(0, Math.min(currentIndex, category.photos.length - 1));
      });

      return next;
    });
  }, [randomizedSelectPhotosByCategory]);

  useEffect(() => {
    if (!fullscreenPhotographerId) {
      return undefined;
    }

    function handleFullscreenKeys(event) {
      if (event.key === 'Escape') {
        setFullscreenPhotographerId(null);
        return;
      }

      if (event.key === 'ArrowLeft') {
        movePhoto(fullscreenPhotographerId, -1);
        return;
      }

      if (event.key === 'ArrowRight') {
        movePhoto(fullscreenPhotographerId, 1);
        return;
      }

      if (event.key === 'Enter') {
        confirmCurrentPhoto(fullscreenPhotographerId);
        setFullscreenPhotographerId(null);
      }
    }

    window.addEventListener('keydown', handleFullscreenKeys);
    return () => window.removeEventListener('keydown', handleFullscreenKeys);
  }, [fullscreenPhotographerId, currentPhotoIndexByPhotographer, availablePhotosByPhotographer]);

  useEffect(() => {
    if (!isSelectFullscreenOpen) {
      return undefined;
    }

    function handleSelectFullscreenKeys(event) {
      if (event.key === 'Escape') {
        setIsSelectFullscreenOpen(false);
        return;
      }

      if (event.key === 'ArrowLeft') {
        moveSelectPhoto(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        moveSelectPhoto(1);
      }
    }

    window.addEventListener('keydown', handleSelectFullscreenKeys);
    return () => window.removeEventListener('keydown', handleSelectFullscreenKeys);
  }, [isSelectFullscreenOpen, selectCategoryIndex, selectPhotoIndexByCategory, randomizedSelectPhotosByCategory]);

  useEffect(() => {
    if (!starredPhotosForListing.length) {
      setUltimateFullscreenIndex(0);
      setIsUltimateFullscreenOpen(false);
      return;
    }

    setUltimateFullscreenIndex((current) => Math.min(current, starredPhotosForListing.length - 1));
  }, [starredPhotosForListing]);

  useEffect(() => {
    if (!isUltimateFullscreenOpen) {
      return undefined;
    }

    function handleUltimateFullscreenKeys(event) {
      if (event.key === 'Escape') {
        setIsUltimateFullscreenOpen(false);
        return;
      }

      if (event.key === 'ArrowLeft') {
        moveUltimatePhoto(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        moveUltimatePhoto(1);
      }
    }

    window.addEventListener('keydown', handleUltimateFullscreenKeys);
    return () => window.removeEventListener('keydown', handleUltimateFullscreenKeys);
  }, [isUltimateFullscreenOpen, starredPhotosForListing, ultimateFullscreenIndex]);

  useEffect(() => {
    if (!photoCatalog.length) {
      setListingPhotographerId('');
      return;
    }

    const exists = photoCatalog.some((photographer) => photographer.photographerId === listingPhotographerId);
    if (!exists) {
      setListingPhotographerId(photoCatalog[0].photographerId);
    }
  }, [photoCatalog, listingPhotographerId]);

  useEffect(() => {
    const photos = listingPhotosForPhotographer;
    if (!photos.length) {
      setListingFullscreenIndex(0);
      setIsListingFullscreenOpen(false);
      return;
    }

    setListingFullscreenIndex((current) => Math.min(current, photos.length - 1));
  }, [listingPhotosForPhotographer]);

  useEffect(() => {
    if (!isListingFullscreenOpen) {
      return undefined;
    }

    function handleListingFullscreenKeys(event) {
      if (event.key === 'Escape') {
        setIsListingFullscreenOpen(false);
        return;
      }

      if (event.key === 'ArrowLeft') {
        moveListingPhoto(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        moveListingPhoto(1);
      }
    }

    window.addEventListener('keydown', handleListingFullscreenKeys);
    return () => window.removeEventListener('keydown', handleListingFullscreenKeys);
  }, [isListingFullscreenOpen, listingPhotosForPhotographer, listingFullscreenIndex]);

  const currentSelectCategory = randomizedSelectPhotosByCategory[selectCategoryIndex];
  const currentSelectPhoto = getCurrentSelectPhoto();
  const currentSelectIndex = selectPhotoIndexByCategory[selectCategoryIndex] ?? 0;
  const currentSelectIsStarred =
    bestPhotoByCategory[selectCategoryIndex] === (currentSelectPhoto ? currentSelectPhoto.photoId : null);

  const setupFullscreenPhoto = fullscreenPhotographerId ? getCurrentPhoto(fullscreenPhotographerId) : null;
  const setupFullscreenPhotographer = fullscreenPhotographerId
    ? photoCatalog.find((item) => item.photographerId === fullscreenPhotographerId)
    : null;

  const currentUltimatePhoto = starredPhotosForListing[ultimateFullscreenIndex] ?? null;
  const currentListingPhoto = listingPhotosForPhotographer[listingFullscreenIndex] ?? null;

  return (
    <section className="compare-page">
      <SidebarNav
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onExportWsc={handleExportWsc}
        onImportWsc={handleImportWscClick}
      />

      <div className="compare-canvas">
        <input
          ref={wscImportInputRef}
          type="file"
          accept=".wsc,application/json"
          hidden
          onChange={handleImportWscFile}
        />
        {activeSection === 'Upload' ? (
          <UploadSection
            photographerModules={photographerModules}
            onDelete={openDeleteDialog}
            onNameChange={handleNameChange}
            setFileInputRef={setFileInputRef}
            onFilesSelected={handlePhotographerFiles}
            onOpenPicker={openPhotographerFilePicker}
            uploadStatusByPhotographer={uploadStatusByPhotographer}
            uploadedPhotosByPhotographer={uploadedPhotosByPhotographer}
            onAddPhotographer={handleAddPhotographer}
          />
        ) : null}

        {activeSection === 'Setup' ? (
          <SetupSection
            activeTheme={activeTheme}
            onThemeChange={updateActiveTheme}
            isAnonymousMode={isAnonymousMode}
            onSetNameMode={() => setIsAnonymousMode(false)}
            onSetAnonymousMode={() => setIsAnonymousMode(true)}
            setupPageIndex={setupPageIndex}
            confirmedRoundsCount={confirmedRounds.length}
            onPreviousPage={goToPreviousSetupPage}
            onNextPage={goToNextSetupPage}
            photoCatalog={photoCatalog}
            availablePhotosByPhotographer={availablePhotosByPhotographer}
            currentPhotoIndexByPhotographer={currentPhotoIndexByPhotographer}
            activeSelectedPhotoByPhotographer={activeSelectedPhotoByPhotographer}
            onOpenFullscreen={setFullscreenPhotographerId}
            onMovePhoto={movePhoto}
            onConfirmCurrentPhoto={confirmCurrentPhoto}
            canConfirmSetup={canConfirmSetup}
            onConfirmSetupRound={confirmSetupRound}
            isViewingConfirmedPage={isViewingConfirmedPage}
          />
        ) : null}

        {activeSection === 'Select' ? (
          <SelectSection
            isAnonymousMode={isAnonymousMode}
            onSetNameMode={() => setIsAnonymousMode(false)}
            onSetAnonymousMode={() => setIsAnonymousMode(true)}
            selectCategoryIndex={selectCategoryIndex}
            categories={randomizedSelectPhotosByCategory}
            onPreviousCategory={goToPreviousSelectCategory}
            onNextCategory={goToNextSelectCategory}
            currentPhoto={currentSelectPhoto}
            currentIndex={currentSelectIndex}
            isStarred={currentSelectIsStarred}
            onOpenFullscreen={() => setIsSelectFullscreenOpen(true)}
            onMovePhoto={moveSelectPhoto}
            onToggleBestPhoto={toggleBestPhoto}
          />
        ) : null}

        {activeSection === 'Ultimate Listing' ? (
          <UltimateListingSection
            isAnonymousMode={isAnonymousMode}
            onSetNameMode={() => setIsAnonymousMode(false)}
            onSetAnonymousMode={() => setIsAnonymousMode(true)}
            isDownloadingPdf={isDownloadingPdf}
            onDownloadPdf={handleDownloadPdf}
            starredPhotos={starredPhotosForListing}
            onOpenFullscreen={openUltimateFullscreen}
          />
        ) : null}

        {activeSection === 'Listing per photographer' ? (
          <PhotographerListingSection
            photoCatalog={photoCatalog}
            listingPhotographerId={listingPhotographerId}
            onListingPhotographerChange={setListingPhotographerId}
            isDownloadingPdf={isDownloadingPhotographerPdf}
            onDownloadPdf={handleDownloadPhotographerPdf}
            listingPhotographer={listingPhotographer}
            listingPhotos={listingPhotosForPhotographer}
            onOpenFullscreen={openListingFullscreen}
          />
        ) : null}

        {pendingDeleteId ? <DeleteConfirmModal onConfirm={confirmDelete} onCancel={closeDeleteDialog} /> : null}

        {fullscreenPhotographerId ? (
          <SetupFullscreenModal
            photographerName={setupFullscreenPhotographer?.photographerName}
            photo={setupFullscreenPhoto}
            onBack={() => movePhoto(fullscreenPhotographerId, -1)}
            onNext={() => movePhoto(fullscreenPhotographerId, 1)}
            onConfirm={() => {
              confirmCurrentPhoto(fullscreenPhotographerId);
              setFullscreenPhotographerId(null);
            }}
            onClose={() => setFullscreenPhotographerId(null)}
          />
        ) : null}

        {isSelectFullscreenOpen ? (
          <SelectFullscreenModal
            theme={currentSelectCategory?.theme}
            photo={currentSelectPhoto}
            currentIndex={currentSelectIndex}
            total={currentSelectCategory?.photos.length ?? 0}
            isStarred={currentSelectIsStarred}
            onBack={() => moveSelectPhoto(-1)}
            onNext={() => moveSelectPhoto(1)}
            onToggleStar={toggleBestPhoto}
            onClose={() => setIsSelectFullscreenOpen(false)}
          />
        ) : null}

        {isUltimateFullscreenOpen ? (
          <UltimateFullscreenModal
            title={
              currentUltimatePhoto
                ? isAnonymousMode
                  ? currentUltimatePhoto.theme
                  : `${currentUltimatePhoto.theme} - ${currentUltimatePhoto.photographerName}`
                : ''
            }
            photo={currentUltimatePhoto}
            currentIndex={ultimateFullscreenIndex}
            total={starredPhotosForListing.length}
            onBack={() => moveUltimatePhoto(-1)}
            onNext={() => moveUltimatePhoto(1)}
            onClose={() => setIsUltimateFullscreenOpen(false)}
          />
        ) : null}

        {isListingFullscreenOpen ? (
          <UltimateFullscreenModal
            title={listingPhotographer?.photographerName ?? ''}
            photo={currentListingPhoto}
            currentIndex={listingFullscreenIndex}
            total={listingPhotosForPhotographer.length}
            onBack={() => moveListingPhoto(-1)}
            onNext={() => moveListingPhoto(1)}
            onClose={() => setIsListingFullscreenOpen(false)}
          />
        ) : null}
      </div>
    </section>
  );
}

export default CompareWorkshopPage;
