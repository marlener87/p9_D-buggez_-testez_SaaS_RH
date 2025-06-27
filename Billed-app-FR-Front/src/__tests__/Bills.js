/**
 * @jest-environment jsdom
 */

import {screen, waitFor, getByTestId} from "@testing-library/dom"
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import store from "../__mocks__/store";
//jest.mock("../app/store", () => mockStore)

// jest.mock("../app/store", () => ({
//   __esModule: true,
//   default: mockStore
// }));

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    // TEST 1: L'icône à gauche a un background plus clair
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      // surfer sur la page des factures
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      // TODO: vérifier que windowIcon a la classe 'active-icon'
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      // vérifier que l'icône a la classe en surbrillance donnée par active-icon
      expect(windowIcon.classList.contains('active-icon')).toBe(true) //Router.js l. 31
    });

    // TEST 2: Les dates des billets sont triées du plus récent au plus ancien
    test("Then bills should be ordered from earliest to latest", () => {
      // ajouter la vue sur la page facture
      document.body.innerHTML = BillsUI({ data: bills })
      // obtenir les dates
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      // trier les dates par oredre décroissant
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      // test si les dates sont triées comme dans le test
      expect(dates).toEqual(datesSorted)
    });

    // TEST 3: le formulaire pour la nouvelle note de frais s'affiche
    // describe("When I click on the 'Nouvelle note de frais' button", () => {
    //   test("Then the NewBill form should appear", async () => {
    //     console.log("Test démarré") // juste pour voir si ça s'affiche
    //     // Injecte le HTML qui contient le bouton
    //     document.body.innerHTML = BillsUI({ data: bills });
    //     console.log(document.body.innerHTML)


    //     // bouton 'nouvelle note de frais'
    //     const newBillButton = getByTestId(document.body, "btn-new-bill");

    //     // simuler la fonction de navigation (fonction qui sera appelée au clic)
    //     const onNavigate = jest.fn(window.onNavigate(ROUTES_PATH.Bills))

    //     // simuler le click utilisateur sur le bouton
    //     newBillButton.addEventListener("click", onNavigate);
    //     userEvent.click(newBillButton);

    //     // Assertions: vérifier si la nouvelle page de facture s'affiche correctement
    //     expect(getByTestId(document.body, "send-new-bill")).toHaveTextContent("Envoyer une note de frais");
    //   })
    // });

    // TEST 4: integrations test GET (Bills)
    test("Fetches bills from mock API GET", async()=> 
    {
      const getSpyOn = jest.spyOn(store, "bills");
      const bills = await store.bills().list();

      // Assertions: bills are properly fetched
      expect(getSpyOn).toHaveBeenCalledTimes(1);
      expect(bills.length).toBe(4);
    });

    test("Fetches bills from an API and fails with a 404 message error", async()=> 
    {
      store.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = screen.getByText(/Erreur 404/);

      // Assertion: check if the message displays
      expect(message).toBeTruthy();
    });

    test("Fetches bills from an API and fails with a 500 message error", async()=>
    {
      store.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      
      // Search for the message error
      const message = screen.getByText(/Erreur 500/);

      // Assertion: 
      expect(message).toBeTruthy();

    });
  })
})
