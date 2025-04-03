import { Locator, Page } from '@playwright/test';

export class CreateInventory {
  page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.goto('http://localhost:5173/');
    }
  async managerNavigate() {
    await this.page.goto('http://localhost:5173/manager');
  }

  async navigateToCreateForm() {
    await this.page.getByText('Add Item').click();
  }

  itemNameField(): Locator {
    return this.page.getByRole('textbox', { name: 'e.g., Classic T-Shirt' });
  }

}