import eyeBlueIcon from "../assets/svg/eye_blue.js";
import downloadBlueIcon from "../assets/svg/download_blue.js";

export default (billUrl, billId) => {
  return `<div class="icon-actions">
      <div id="eye" data-testid="icon-eye" data-bill-url=${billUrl}>
      ${eyeBlueIcon}
      </div>
      <button id="delete-btn" data-bill-id=${billId}>
        X
      </button>
    </div>`;
};
