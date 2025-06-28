/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH} from "../constants/routes.js";


describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        // TEST 1: validation du téléchargement d'une pièce jointe (au format demandé)
        test("should upload file with valid extension", async () => {
            document.body.innerHTML = NewBillUI();

            // simule un user dans le localStorage global
            window.localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }));

            // mock du store
            const mockCreate = jest.fn(() => Promise.resolve({ fileUrl: "url", key: "key" }));
            const store = { bills: () => ({ create: mockCreate }) };

            const newBill = new NewBill({ 
                document, 
                onNavigate: jest.fn(), 
                store, 
                localStorage: window.localStorage
            });

            const fileInput = screen.getByTestId("file");
            const file = new File(["content"], "test.png", { type: "image/png" });
            Object.defineProperty(fileInput, 'files', { value: [file] });

            await newBill.handleChangeFile({ preventDefault: () => {}, target: fileInput });

            expect(mockCreate).toHaveBeenCalled();
            expect(newBill.fileUrl).toBe("url");
            expect(newBill.fileName).toBe("test.png");
        });

        // TEST 2: refus un fichier d'une extension non valide
        test("should refuse invalid file extension", async () => {
            document.body.innerHTML = NewBillUI();

            // mock localStorage
            window.localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }));

            // crée le NewBill (store inutile ici)
            const newBill = new NewBill({
                document,
                onNavigate: jest.fn(),
                store: null,
                localStorage: window.localStorage
            });

            // mock alert
            window.alert = jest.fn();

            const fileInput = screen.getByTestId("file");

            // simule l'upload d'un PDF
            const invalidFile = new File(["data"], "bad.pdf", { type: "application/pdf" });
            await userEvent.upload(fileInput, invalidFile);

            // vérifie l'appel à alert
            expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers .jpg, .jpeg et .png sont acceptés.");
            
            // Vérifie que le champ a été vidé
            expect(fileInput.value).toBe("");
            expect(newBill.fileUrl).toBeNull();
            expect(newBill.fileName).toBeNull();
        });

        // TEST 3: soumet le formulaire et appelle 'updateBill' et 'onNavigate'
        test("should submit form and call updateBill and onNavigate", () => {
        // Arrange
        document.body.innerHTML = NewBillUI();

        // fake localStorage
        window.localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }));

        const onNavigate = jest.fn();
        const store = null; // on n'en a pas besoin pour ce test car updateBill sera mocké

        const newBill = new NewBill({
            document,
            onNavigate,
            store,
            localStorage: window.localStorage
        });

        // mock updateBill pour vérifier l'appel
        newBill.updateBill = jest.fn();

        // remplir les champs du formulaire
        screen.getByTestId("expense-type").value = "Transports";
        screen.getByTestId("expense-name").value = "Taxi";
        screen.getByTestId("amount").value = "42";
        screen.getByTestId("datepicker").value = "2023-01-01";
        screen.getByTestId("vat").value = "20";
        screen.getByTestId("pct").value = "20";
        screen.getByTestId("commentary").value = "Course de taxi";

        // simuler fileUrl et fileName dans l'instance
        newBill.fileUrl = "https://example.com/test.png";
        newBill.fileName = "test.png";

        // act : déclencher le submit en simulant un  évènement
        const form = screen.getByTestId("form-new-bill");
        const fakeEvent = { preventDefault: () => {}, target: form };
        newBill.handleSubmit(fakeEvent);

        // assert : vérifier que updateBill a été appelée avec les bons arguments
        expect(newBill.updateBill).toHaveBeenCalledWith(expect.objectContaining({
            email: "test@test.com",
            type: "Transports",
            name: "Taxi",
            amount: 42,
            date: "2023-01-01",
            vat: "20",
            pct: 20,
            commentary: "Course de taxi",
            fileUrl: "https://example.com/test.png",
            fileName: "test.png",
            status: "pending"
        }));

        // vérifier que la navigation vers '/bills' a bien été appelée
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
        });

        // TEST 4: test d'intégration POST
        test("should post new bill to mock API", async () => {
            document.body.innerHTML = NewBillUI();

            const store = {
                bills: () => ({
                create: jest.fn(() => Promise.resolve({ fileUrl: "url", key: "key" })),
                update: jest.fn(() => Promise.resolve()),
                }),
            };

            const onNavigate = jest.fn();
            const newBill = new NewBill({ document, onNavigate, store, localStorage: { getItem: () => JSON.stringify({ email: "test@test.com" }) } });

            newBill.fileUrl = "url";
            newBill.fileName = "test.png";

            screen.getByTestId("expense-type").value = "Transports";
            screen.getByTestId("expense-name").value = "Taxi";
            screen.getByTestId("amount").value = "40";
            screen.getByTestId("datepicker").value = "2023-01-01";
            screen.getByTestId("vat").value = "10";
            screen.getByTestId("pct").value = "20";
            screen.getByTestId("commentary").value = "note";

            const fakeEvent = { preventDefault: () => {}, target: document.querySelector("form") };
            await newBill.handleSubmit(fakeEvent);

            expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
        });
    })
})
