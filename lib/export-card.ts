import { toPng } from 'html-to-image'

export async function exportProfileCardAsPng(element: HTMLElement, filename: string) {
  // Wait for any pending images / fonts to be ready
  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
    skipFonts: true,
    width: element.offsetWidth,
    height: element.offsetHeight,
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
