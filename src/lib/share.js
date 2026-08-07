export async function shareFood({ title, restaurant, url, imageUrl }) {
  const text = `Ca me ferait trop plaisir si tu me faisais livrer ce repas de ${restaurant}: ${title}.`;
  const shareData = { title: `${title} | Miamgo`, text, url };

  try {
    if (navigator.share && imageUrl) {
      const response = await fetch(imageUrl);
      const image = await response.blob();
      const file = new File([image], "miamgo-repas.jpg", { type: image.type || "image/jpeg" });
      if (navigator.canShare?.({ ...shareData, files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        return;
      }
    }
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch (error) {
    if (error.name === "AbortError") return;
  }

  const whatsappMessage = `${text} ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener,noreferrer");
}
