import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { App } from "../src/app/App";

// jsdom 未實作 <dialog> 的 modal API，補上最小 polyfill 讓開關可被驅動。
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("分流 → dialog → 複製到下游分頁", () => {
  it("把原始資料分類成志工任務並確認後，會出現在志工任務分頁", () => {
    render(<App />);

    // 打開第一筆原始資料的分類 dialog
    const cardButtons = screen.getAllByRole("button", { name: "分類 / 編輯" });
    fireEvent.click(cardButtons[0]);

    const dialog = screen.getByRole("dialog");
    // 選「志工任務」家族
    fireEvent.click(within(dialog).getByRole("button", { name: "志工任務" }));

    // 補齊必填欄位
    fireEvent.change(within(dialog).getByLabelText(/任務標題/), {
      target: { value: "清淤支援" },
    });

    // 確認有效
    const confirm = within(dialog).getByRole("button", { name: "確認有效" });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    fireEvent.click(within(dialog).getByRole("button", { name: "關閉" }));

    // 切到「志工任務」分頁，應看到複製過來的紀錄
    fireEvent.click(screen.getByRole("button", { name: "志工任務" }));
    expect(screen.getByText("清淤支援")).toBeInTheDocument();
    expect(screen.getByText("由資訊分流確認後複製過來")).toBeInTheDocument();
  });

  it("未補齊必填欄位時無法確認有效", () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: "分類 / 編輯" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "地點" }));
    // 地點名稱留空 → 確認有效 disabled
    expect(
      within(dialog).getByRole("button", { name: "確認有效" }),
    ).toBeDisabled();
  });
});
