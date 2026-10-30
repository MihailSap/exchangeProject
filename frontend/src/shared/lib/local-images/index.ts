const PREFIX = "local-image:";

function openImages(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("exchange.local-images.v1", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("images");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error("Не удалось открыть хранилище фотографий на устройстве"));
    request.onblocked = () =>
      reject(
        new Error("Закройте другие вкладки сервиса и попробуйте сохранить фотографии ещё раз"),
      );
  });
}

export function isLocalImage(name: string): boolean {
  return name.startsWith(PREFIX);
}
export async function storeLocalImage(file: File): Promise<string> {
  const database = await openImages();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("images", "readwrite");
      transaction.objectStore("images").put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          new Error("Не удалось сохранить фотографию на устройстве. Проверьте свободное место."),
        );
      transaction.onabort = () => reject(new Error("Сохранение фотографии прервано"));
    });
  } finally {
    database.close();
  }

  return `${PREFIX}${id}`;
}
export async function getLocalImage(name: string): Promise<Blob> {
  const database = await openImages();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const transaction = database.transaction("images", "readonly");
      const request = transaction.objectStore("images").get(name.slice(PREFIX.length));
      request.onsuccess = () => {
        const value: unknown = request.result;
        if (value instanceof Blob && ["image/jpeg", "image/png"].includes(value.type))
          resolve(value);
        else reject(new Error("Фотография не найдена на устройстве"));
      };
      request.onerror = () => reject(new Error("Не удалось загрузить фотографию с устройства"));
    });
  } finally {
    database.close();
  }
}
