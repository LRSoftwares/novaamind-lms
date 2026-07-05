import JSZip from 'jszip';

function parseXml(text) {
  return new DOMParser().parseFromString(text, 'application/xml');
}

export async function extractEpubCoverThumbnail(file) {
  const zip = await JSZip.loadAsync(file);

  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) return null;
  const opfPath = parseXml(containerXml).querySelector('rootfile')?.getAttribute('full-path');
  if (!opfPath) return null;

  const opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) return null;
  const opfDoc = parseXml(opfXml);
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';

  // EPUB3: manifest item marked as the cover image.
  let coverHref = opfDoc.querySelector('manifest item[properties~="cover-image"]')?.getAttribute('href');

  // EPUB2 fallback: metadata meta[name="cover"] points at a manifest item id.
  if (!coverHref) {
    const coverId = opfDoc.querySelector('metadata meta[name="cover"]')?.getAttribute('content');
    if (coverId) {
      coverHref = opfDoc.querySelector(`manifest item[id="${CSS.escape(coverId)}"]`)?.getAttribute('href');
    }
  }

  // Last resort: first image declared in the manifest.
  if (!coverHref) {
    coverHref = opfDoc.querySelector('manifest item[media-type^="image/"]')?.getAttribute('href');
  }

  if (!coverHref) return null;
  const coverFile = zip.file(opfDir + coverHref);
  if (!coverFile) return null;

  return coverFile.async('blob');
}
