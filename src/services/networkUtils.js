/**
 * fetch() çağrısını sarar ve network hatalarını (DNS, bağlantı kopması,
 * zaman aşımı) kullanıcıya anlamlı bir Türkçe mesajla yeniden fırlatır.
 * Sunucudan dönen HTTP hataları (4xx/5xx) olduğu gibi bırakılır, onları
 * çağıran taraf response.ok ile kontrol eder.
 */
export async function safeFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("İstek zaman aşımına uğradı. İnternet bağlantınızı kontrol edin.");
    }
    if (e.message?.includes("Network request failed")) {
      throw new Error(
        "Sunucuya ulaşılamadı. İnternet bağlantınızı veya endpoint adresinin doğruluğunu kontrol edin."
      );
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}
