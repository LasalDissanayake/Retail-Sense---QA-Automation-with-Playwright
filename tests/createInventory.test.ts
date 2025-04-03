import { test } from "@playwright/test";
import {CreateInventory } from "../pages/createInventory";


test.describe('Create Inventory', () => {

  test.beforeEach(async({page}) => {
    await page.goto('http://localhost:5173/manager/inventory-management');
  })

  test('validate Name Section', async ({page}) => {
    const invenForm = new CreateInventory(page);
    invenForm.navigateToCreateForm();
    const itemName = await invenForm.itemNameField();
    await itemName.fill('Classic T-Shirt');
  })

});
  