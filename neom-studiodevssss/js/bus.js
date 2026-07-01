// جسر بسيط لإعادة رسم الواجهة من أي ملف
export const rerender = () => document.dispatchEvent(new CustomEvent("app:render"));
