import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface SmartEditorHandle {
  getProcessedContent: () => Promise<string>;
  getRawContent: () => Promise<string>;
  setContent: (html: string) => void;
}

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  height?: number; 
}

// [수정] 변수명 오타 방지를 위해 정확히 확인
const EDITOR_PLACEHOLDER_ID = "editor";

const SMARTEDITOR_SRC =
  window.location.hostname === "localhost"
    ? "/smarteditor2/index.html"
    : import.meta.env.VITE_APP_TARGET === "admin"
      ? "/cm/smarteditor2/index.html"
      : "/ucm/smarteditor2/index.html";

const SmartEditor = forwardRef<SmartEditorHandle, Props>(({ height = 800 }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [editorHeight, setEditorHeight] = useState(height);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      const { type, height: newHeight } = e.data;

      if (type === "SE2_RESIZE" && typeof newHeight === "number") {
        setEditorHeight(newHeight + 2);
      }

      if (type === "OPEN_IMAGE_UPLOADER") {
        triggerImageUpload();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const triggerImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const indexWin = iframeRef.current?.contentWindow as any;
        if (!indexWin) return;

        waitEditorReady(indexWin, (editor) => {
          editor.exec("CHANGE_EDITING_MODE", ["WYSIWYG"]);
          editor.exec("FOCUS");
          setTimeout(() => {
            editor.exec("PASTE_HTML", [`<p><img src="${base64}" style="max-width:100%;" /></p>`]);
          }, 100);
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // [수정] 여기서 EDITOR_PLACEHOLDER_ID 변수명을 똑같이 맞췄습니다.
  const getEditorApp = (win: any) => win?.oEditors?.getById?.[EDITOR_PLACEHOLDER_ID] || null;

  const waitEditorReady = (win: any, onReady: (editor: any) => void) => {
    let count = 0;
    const tick = () => {
      const editor = getEditorApp(win);
      if (editor) return onReady(editor);
      if (++count < 100) setTimeout(tick, 100);
    };
    tick();
  };

  useImperativeHandle(ref, () => ({
    async getProcessedContent() {
      const win = iframeRef.current?.contentWindow as any;
      return new Promise((res) => waitEditorReady(win, (ed) => res(ed.getIR())));
    },
    async getRawContent() {
      const win = iframeRef.current?.contentWindow as any;
      return new Promise((res) => waitEditorReady(win, (ed) => res(ed.getIR())));
    },
    setContent(html: string) {
      const win = iframeRef.current?.contentWindow as any;
      waitEditorReady(win, (ed) => {
        ed.exec("SET_IR", [html]);
        ed.exec("FOCUS");
      });
    },
  }));

  return (
    <div 
      className="smart-editor-container"
      style={{ width: "100%", height: editorHeight, overflow: "hidden", display: "block", position: "relative" }}
    >
      <iframe
        ref={iframeRef}
        src={SMARTEDITOR_SRC}
        title="SmartEditor"
        scrolling="no"
        style={{ width: "100%", height: "100%", border: "1px solid #ccc", display: "block", overflow: "hidden", boxSizing: "border-box" }}
      />
    </div>
  );
});

export default SmartEditor;