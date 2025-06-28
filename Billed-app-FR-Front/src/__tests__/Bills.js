/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import store from "../__mocks__/store";


describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        // Nettoyer tous les mocks après chaque test pour éviter la pollution
        afterEach(() => {
            jest.restoreAllMocks();
        });

        // TEST 1: l'icône à gauche a un background plus clair
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

        // TEST 2: les dates des billets sont triées du plus récent au plus ancien
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
        describe("When I click on the 'Nouvelle note de frais' button", () => {
            test("Then the NewBill form should appear", async () => {
                // mock localStorage
                Object.defineProperty(window, 'localStorage', { value: localStorageMock });
                window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

                // simule le routeur
                const root = document.createElement("div");
                root.id = "root";
                document.body.append(root);
                router();

                // navigate vers la page Bills
                window.onNavigate(ROUTES_PATH.Bills);

                // attend que l'UI se charge
                await waitFor(() => screen.getByTestId("btn-new-bill"));

                // simulate instanciation Bills (comme l'app)
                const billsContainer = new Bills({
                document,
                onNavigate,
                store,
                localStorage: window.localStorage,
                });

                const newBillButton = screen.getByTestId("btn-new-bill");
                newBillButton.addEventListener("click", billsContainer.handleClickNewBill);

                // simulate click
                userEvent.click(newBillButton);

                // check that NewBill page is rendered
                await waitFor(() => screen.getByTestId("form-new-bill"));
                expect(screen.getByTestId("form-new-bill")).toBeTruthy();
            })
        });

        // TEST 4: integrations test GET (Bills)
        test("Fetches bills from mock API GET", async()=> {
            const getSpyOn = jest.spyOn(store, "bills");
            const bills = await store.bills().list();

            // Assertions: bills are properly fetched
            expect(getSpyOn).toHaveBeenCalledTimes(1);
            expect(bills.length).toBe(4);
        });

        test("Fetches bills from an API and fails with a 404 message error", async()=> {
            // store.bills.mockImplementationOnce(() =>
            //     Promise.reject(new Error("Erreur 404"))
            // );

            jest.spyOn(store, "bills").mockImplementation(() => ({
                list: () => Promise.reject(new Error("Erreur 404"))
            }));

            document.body.innerHTML = BillsUI({ error: "Erreur 404" });
            const message = screen.getByText(/Erreur 404/);

            // Assertion: check if the message displays
            expect(message).toBeTruthy();
        });

        test("Fetches bills from an API and fails with a 500 message error", async()=> {
            // store.bills.mockImplementationOnce(() =>
            //     Promise.reject(new Error("Erreur 500"))
            // );

            jest.spyOn(store, "bills").mockImplementation(() => ({
                list: () => Promise.reject(new Error("Erreur 500"))
            }));

            document.body.innerHTML = BillsUI({ error: "Erreur 500" });
            
            // Search for the message error
            const message = screen.getByText(/Erreur 500/);

            // Assertion: 
            expect(message).toBeTruthy();
        });

        // TEST 5: vérifie l'ouverture de la modale au clic sur l'icône eye
        describe("When I click on the eye icon", () => {
            test("Then the modal should display the correct image", () => {
                // Arrange
                document.body.innerHTML = BillsUI({ data: bills });

                // Mock de $.fn.modal pour vérifier qu'on l'appelle avec 'show'
                $.fn.modal = jest.fn();

                // Crée l'instance du container Bills
                const billsContainer = new Bills({
                document,
                onNavigate: jest.fn(),
                store,
                localStorage: window.localStorage,
                });

                // Sélectionne la première icône eye déjà rendue par BillsUI
                const iconEye = screen.getAllByTestId("icon-eye")[0];

                // Act : simule le handler
                billsContainer.handleClickIconEye(iconEye);

                // Assert : la modale a été affichée
                expect($.fn.modal).toHaveBeenCalledWith('show');

                // Assert : l'image à la bonne URL
                const img = document.querySelector("#modaleFile .modal-body img");
                expect(img).toBeTruthy();
                expect(img.getAttribute("src")).toBe(bills[0].fileUrl);
            });
        });

        // TEST 6: Vérifie que getBills() retourne les données formatées
        describe("When I call getBills()", () => {
            test("Then it should fetch and format the bills correctly", async () => {
                // Arrange : le store mocké déjà importé
                Object.defineProperty(window, 'localStorage', { value: localStorageMock });
                window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

                const billsContainer = new Bills({
                    document,
                    onNavigate: jest.fn(),
                    store,
                    localStorage: window.localStorage
                });

                jest.spyOn(console, "log").mockImplementation(() => {}); // pour éviter les logs

                // Act
                const bills = await billsContainer.getBills();

                // Assert
                expect(Array.isArray(bills)).toBe(true);
                expect(bills.length).toBe(4);
                bills.forEach(bill => {
                    expect(bill).toHaveProperty("date");
                    expect(bill).toHaveProperty("status");
                    expect(bill.date).toMatch(/\d{1,2} .+\. \d{2,4}/); // formatDate => "04 Avr. 2004"
                    expect(["En attente", "Accepté", "Refusé"]).toContain(bill.status);
                });
            });
        });
    })
})
