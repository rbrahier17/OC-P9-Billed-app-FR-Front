/**
 * @jest-environment jsdom
 */

import { toHaveClass } from "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import NewBillUI from "../views/NewBillUI.js";
import BillsContainer from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import * as formatUtils from "../app/format";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

/**
 * formatBills UNIT TESTS
 */
describe("'formatBills' method unit test suite", () => {
  let mockedFormatDate;
  let mockedFormatStatus;
  let formattedBills;

  beforeAll(() => {
    mockedFormatDate = jest.spyOn(formatUtils, "formatDate");
    mockedFormatStatus = jest.spyOn(formatUtils, "formatStatus");
    formattedBills = BillsContainer.formatBills(bills);
  });

  test("it should call the 'mockedFormatDate' and the 'mockedFormatStatus' functions", () => {
    expect(mockedFormatDate).toHaveBeenCalled();
    expect(mockedFormatStatus).toHaveBeenCalled();
  });
  test("It should return an array of the same length as the input length", () => {
    expect(formattedBills).toBeInstanceOf(Array);
    expect(formattedBills.length).toBe(bills.length);
  });
  test("Each formatted bill should have the property 'formattedDate'", () =>
    formattedBills.forEach((bill) => expect(bill).toHaveProperty("formattedDate")));
  test("If data date is corrupted on a bill, this bill should not have the 'formattedDate' property but other bills should", () => {
    bills[0].date = "corrupted-data";
    formattedBills = BillsContainer.formatBills(bills);
    expect(formattedBills.shift()).not.toHaveProperty("formattedDate"); // shift() delete the first element an returns it
    formattedBills.forEach((bill) => expect(bill).toHaveProperty("formattedDate"));
  });
});

/**
 * getBills UNIT TESTS
 */
describe("'getBills' method unit test suite", () => {
  const billsContainer = new BillsContainer({
    document,
    onNavigate: (pathname) => (document.body.innerHTML = ROUTES({ pathname })),
    store: mockStore,
    localStorage: window.localStorage,
  });

  test("it should call the 'getRawData' and the 'formatBills' methods", async () => {
    jest.spyOn(billsContainer, "getRawData");
    jest.spyOn(BillsContainer, "formatBills");
    await billsContainer.getBills();
    expect(billsContainer.getRawData).toHaveBeenCalled();
    expect(BillsContainer.formatBills).toHaveBeenCalled();
  });

  test("it should return an array with the same length as the list function of the mocked store", async () => {
    const mockStoreData = await mockStore.bills().list();
    const res = await billsContainer.getBills();
    expect(res).toBeInstanceOf(Array);
    expect(res.length).toBe(mockStoreData.length);
  });

  test("if the data returned from the store is null, it should return an empty array", async () => {
    jest.spyOn(mockStore, "bills");
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.resolve(null);
        },
      };
    });
    let res = await billsContainer.getBills();
    expect(res).toStrictEqual([]);
  });
});

/**
 * INTEGRATION TESTS
 */
describe("Given I am connected as an employee and I am on Bills Page", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
  });

  test("Then bill icon in vertical layout should be highlighted", () => {
    const windowIcon = screen.getByTestId("icon-window");
    expect(windowIcon).toHaveClass("active-icon");
  });

  test("Then the page should display the correct title", async () => {
    const pageTitle = document.querySelector(".content-title");
    expect(pageTitle.textContent.trim()).toBe("Mes notes de frais");
  });

  test("Then 4 bills should be fetched from the mocked API with the expected formatted datas", async () => {
    const displayedBills = screen.getAllByTestId("bill");
    expect(displayedBills.length).toBe(4);
    const formattedDateOfTheFirstStoreBill = await screen.findByText("4 Avr. 04");
    expect(formattedDateOfTheFirstStoreBill).toBeTruthy();
    const formattedStatusOfTheFirstStoreBill = await screen.findByText("En attente");
    expect(formattedStatusOfTheFirstStoreBill).toBeTruthy();
  });

  test("Then bills should be ordered from earliest to latest", () => {
    const displayedBills = screen.getAllByTestId("bill");
    const dates = displayedBills.map((el) => el.getAttribute("data-raw-date"));
    const antiChrono = (a, b) => (a < b ? 1 : -1);
    const datesSorted = [...dates].sort(antiChrono);
    expect(dates).toEqual(datesSorted);
  });

  describe("When I click on eye icon of the first bill", () => {
    test("Then, a modal should be displayed", () => {
      const handleClickIconEye = jest.fn(BillsContainer.handleClickIconEye);
      const firstBillEyeIcon = document.getElementById("eye");
      firstBillEyeIcon.addEventListener("click", handleClickIconEye);
      userEvent.click(firstBillEyeIcon);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect(screen.getByTestId("modaleFile")).toBeVisible();
    });
  });

  describe("When I click 'New Bill' button", () => {
    test("Then, I should navigate to new Bill page", () => {
      const handleClickNewBill = jest.fn(BillsContainer.handleClickNewBill);
      const newBillBtn = screen.getByTestId("btn-new-bill");
      newBillBtn.addEventListener("click", handleClickNewBill());
      userEvent.click(newBillBtn);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(global.window.location.href).toContain("bill/new");
    });
  });

  /**
   * API ERROR TESTS
   */
  describe("When an error occurs on API", () => {
    beforeEach(() => jest.spyOn(mockStore, "bills"));
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      const message = await screen.findByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      const message = await screen.findByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
