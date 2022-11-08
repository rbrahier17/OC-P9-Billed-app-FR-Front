/**
 * @jest-environment jsdom
 */

import { toHaveClass } from "@testing-library/jest-dom";
import { screen, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
jest.mock("../app/store", () => mockStore);
import router from "../app/Router.js";

/**
 * Unit tests suite for hide and show DOM elements methods
 */
describe("'show(el)' and 'hide(el)' methods unit test suite", () => {
  test("Call the 'show' method on an element that contains the 'hidden' class should remove this class", () => {
    const newDiv = document.createElement("div");
    newDiv.classList.add("hidden");
    NewBill.show(newDiv);
    expect(newDiv.classList).not.toContain("hidden");
  });
  test("Call the 'hide' method on an element should add this class", () => {
    const newDiv = document.createElement("div");
    NewBill.hide(newDiv);
    expect(newDiv.classList).toContain("hidden");
  });
});

/**
 * Integration tests suite of general page display
 */
describe("Given I am connected as an employe and navigate to NewBill Page", () => {
  beforeEach(() => {
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
    window.onNavigate(ROUTES_PATH.NewBill);
  });

  test("Then the title 'Envoyer une note de frais' should be displayed", () => {
    expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
  });

  test("Then a form should be displayed with 8 fields", () => {
    const formFields = document.querySelectorAll("form input, form textarea, form select");
    expect(formFields.length).toBe(8);
  });

  test("Then mail icon in vertical layout should be highlighted", () => {
    const mailIcon = screen.getByTestId("icon-mail");
    expect(mailIcon).toHaveClass("active-icon");
  });
});

/**
 * Integration tests suite of the input file
 */
describe("Given I am on NewBill page", () => {
  let newBill;
  beforeEach(() => {
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    newBill = new NewBill({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
  });

  describe("When I add a file to the form with 'png' extension", () => {
    test("Then the file should be added to the input and the error message should still have the hidden class", async () => {
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["blob"], "myImage.png", { type: "image/png" })],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("myImage.png");
      const errorMsg = screen.getByText("Veuillez respecter le format requis.");
      expect(errorMsg).toHaveClass("hidden");
    });
  });

  describe("When I add a file to the form with 'pdf' extension", () => {
    test("Then the error-message should not have the class 'hidden'", async () => {
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["blob"], "myImage.pdf", { type: "application/pdf" })],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      const errorMsg = screen.getByText("Veuillez respecter le format requis.");
      expect(errorMsg).not.toHaveClass("hidden");
    });
  });
});

/**
 * Integration tests suite for the form submission
 */
describe("When I fill all the form fields correctly and I submit the form", () => {
  let newBill;
  let handleChangeFile;
  let handleSubmit;

  beforeAll(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
      })
    );
    document.body.innerHTML = NewBillUI();

    const onNavigate = (pathname) => {
      let data = [];
      document.body.innerHTML = ROUTES({
        pathname,
        data,
      });
    };

    newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

    const inputExpenseType = screen.getByTestId("expense-type");
    const inputExpenseName = screen.getByTestId("expense-name");
    const inputDate = screen.getByTestId("datepicker");
    const inputAmount = screen.getByTestId("amount");
    const inputVat = screen.getByTestId("vat");
    const inputPct = screen.getByTestId("pct");
    const inputCommentary = screen.getByTestId("commentary");
    const inputFile = screen.getByTestId("file");

    userEvent.type(inputExpenseType, "Transports");
    userEvent.type(inputExpenseName, "Vol Paris Londres");
    userEvent.type(inputDate, "2022-10-01");
    userEvent.type(inputAmount, "348");
    userEvent.type(inputVat, "70");
    userEvent.type(inputPct, "20");
    userEvent.type(inputCommentary, "My commentary");

    handleChangeFile = jest.fn(newBill.handleChangeFile);
    handleSubmit = jest.spyOn(newBill, "handleSubmit");

    const formNewBill = screen.getByTestId("form-new-bill");

    fireEvent.change(inputFile, {
      target: {
        files: [new File(["blob"], "myImage.pdf", { type: "application/pdf" })],
      },
    });

    inputFile.addEventListener("change", handleChangeFile);
    formNewBill.addEventListener("submit", handleSubmit);

    userEvent.upload(
      inputFile,
      new File(["myImage"], "myImage.jpg", {
        type: "image/jpg",
      })
    );
    fireEvent.submit(formNewBill);
  });
  test("Then the handleChangeFile method should have been called", async () => {
    expect(handleChangeFile).toHaveBeenCalled();
  });
  test("Then the handleSubmit method should have been called", async () => {
    expect(handleSubmit).toHaveBeenCalled();
  });

  test("Then the mockStore.bills method should have been called", async () => {
    expect(mockStore.bills).toHaveBeenCalled();
  });

  test("Then the Bills page title should be displayed", async () => {
    const billsPageTitle = await screen.findByText("Mes notes de frais");
    expect(billsPageTitle).toBeTruthy();
  });
});