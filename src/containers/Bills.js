import { ROUTES_PATH } from "../constants/routes.js";
import { formatDate, formatStatus } from "../app/format.js";
import Logout from "./Logout.js";

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const buttonNewBill = document.querySelector(`button[data-testid="btn-new-bill"]`);
    if (buttonNewBill) buttonNewBill.addEventListener("click", this.handleClickNewBill);
    const iconEye = document.querySelectorAll(`div[data-testid="icon-eye"]`);
    const deleteBtns = document.querySelectorAll("#delete-btn");
    if (iconEye)
      iconEye.forEach((icon) => {
        icon.addEventListener("click", () => this.handleClickIconEye(icon));
      });
    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", () => this.handleClickDelete(btn));
    });
    new Logout({ document, localStorage, onNavigate });
  }

  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH["NewBill"]);
  };

  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url");
    const imgWidth = Math.floor($("#modaleFile").width() * 0.5);
    $("#modaleFile")
      .find(".modal-body")
      .html(
        `<div style='text-align: center;' class="bill-proof-container"><img width=${imgWidth} src=${billUrl} alt="Bill" /></div>`
      );
    $("#modaleFile").modal("show");
  };

  handleClickDelete = (btn) => {
    const billId = btn.getAttribute("data-bill-id");
    if (this.store) {
      this.store
        .bills()
        .delete({ selector: billId })
        .then((res) => console.log(res))
        .catch((error) => console.error(error));
    }
  };

  getRawData = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then((snapshot) => snapshot);
    }
  };

  formatBills(data) {
    const bills = data.map((doc) => {
      try {
        return {
          ...doc,
          formattedDate: formatDate(doc.date),
          status: formatStatus(doc.status),
        };
      } catch (e) {
        // if for some reason, corrupted data was introduced, we manage here failing formatDate function
        // log the error and return unformatted date in that case
        console.log(e, "for", doc);
        return {
          ...doc,
          date: doc.date,
          status: formatStatus(doc.status),
        };
      }
    });
    return bills;
  }

  getBills = async () => {
    const data = await this.getRawData();
    return this.formatBills(data);
  };
}
