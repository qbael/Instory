// utils/ConfirmDialog.js
class ConfirmDialog {
  static show({
    title = "Xác nhận",
    message = "Bạn có chắc chắn?",
    confirmText = "Đồng ý",
    cancelText = "Hủy",
  }) {
    return new Promise((resolve) => {
      let isLoading = false;

      const overlay = document.createElement("div");
      overlay.className =
        "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]";

      const dialog = document.createElement("div");
      dialog.className =
        "bg-white rounded-xl p-5 w-[320px] text-center shadow-xl animate-fadeIn";

      dialog.innerHTML = `
        <h3 class="mb-2 font-bold text-lg">${title}</h3>
        <p class="mb-5 text-gray-600">${message}</p>
        <div class="flex justify-center gap-3">
          <button id="cancelBtn"
            class="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 transition cursor-pointer">
            ${cancelText}
          </button>
          <button id="confirmBtn"
            class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition cursor-pointer">
            ${confirmText}
          </button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const cleanup = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      };

      const confirmBtn = dialog.querySelector(
        "#confirmBtn",
      ) as HTMLButtonElement;
      const cancelBtn = dialog.querySelector("#cancelBtn") as HTMLButtonElement;

      if (!confirmBtn || !cancelBtn) return;

      confirmBtn.onclick = () => {
        if (isLoading) return; // chống spam click
        isLoading = true;

        // disable button + UI feedback
        confirmBtn.setAttribute("disabled", "true");
        confirmBtn.classList.add("opacity-50", "cursor-not-allowed");
        confirmBtn.innerText = "Đang xử lý...";

        cleanup();
        resolve(true);
      };

      cancelBtn.onclick = () => {
        if (isLoading) return;
        cleanup();
        resolve(false);
      };
    });
  }
}

export default ConfirmDialog;
