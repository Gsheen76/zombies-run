// @ts-check
import { test, expect } from '@playwright/test';

test.describe('僵尸快跑游戏测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
  });

  test('主菜单界面 - 验证游戏标题和菜单按钮', async ({ page }) => {
    await expect(page.locator('.game-title')).toContainText('僵尸快跑');
    await expect(page.locator('.btn-adventure')).toBeVisible();
    await expect(page.locator('.btn-garden')).toBeVisible();
    await expect(page.locator('.btn-shop')).toBeVisible();
    await expect(page.locator('.btn-almanac')).toBeVisible();
    await expect(page.locator('.btn-settings')).toBeVisible();
  });

  test('冒险模式 - 进入关卡选择', async ({ page }) => {
    await page.click('.btn-adventure');
    await expect(page.locator('#levelSelectScreen')).toBeVisible();
    await expect(page.locator('#levelSelectScreen h2')).toContainText('选择关卡');
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('花园系统 - 进入花园界面', async ({ page }) => {
    await page.click('.btn-garden');
    await expect(page.locator('#gardenScreen')).toBeVisible();
    await expect(page.locator('#gardenScreen h2')).toContainText('我的花园');
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('商店系统 - 进入商店界面', async ({ page }) => {
    await page.click('.btn-shop');
    await expect(page.locator('#shopScreen')).toBeVisible();
    await expect(page.locator('#shopScreen h2')).toContainText('商店');
    await expect(page.locator('.coin-info')).toBeVisible();
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('设置系统 - 进入设置界面', async ({ page }) => {
    await page.click('.btn-settings');
    await expect(page.locator('#settingsScreen')).toBeVisible();
    await expect(page.locator('#settingsScreen h2')).toContainText('设置');
    await expect(page.locator('#bgmVolume')).toBeVisible();
    await expect(page.locator('#sfxVolume')).toBeVisible();
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('图鉴系统 - 进入图鉴界面', async ({ page }) => {
    await page.click('.btn-almanac');
    await expect(page.locator('#almanacScreen')).toBeVisible();
    await expect(page.locator('#almanacScreen h2')).toContainText('图鉴');
    await expect(page.locator('.tab-btn', { hasText: '植物' })).toBeVisible();
    await expect(page.locator('.tab-btn', { hasText: '僵尸' })).toBeVisible();
    await expect(page.locator('.back-btn')).toBeVisible();
  });

  test('返回功能 - 从关卡选择返回主菜单', async ({ page }) => {
    await page.click('.btn-adventure');
    await expect(page.locator('#levelSelectScreen')).toBeVisible();
    await page.click('.back-btn');
    await expect(page.locator('#mainMenuScreen')).toBeVisible();
  });
});
