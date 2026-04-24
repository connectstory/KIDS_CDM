export default function CommentForReason() {
  return (
    <>
      <style>{`
          .partner-information-write {
          font-family: "Malgun Gothic", Arial, sans-serif;
          background: #ffffff;
          padding: 20px;
          color: #333;
        }

          .container {
          width: 640px;
          border-top: 2px solid #f39800;
        }

          .title {
          font-weight: bold;
          color: #f39800;
          margin: 6px 0 10px;
        }

          .form-box {
          border: 1px solid #cfcfcf;
          padding: 10px;
          background: #f7f7f7;
        }

          .row {
          display: flex;
          align-items: center;
          margin-bottom: 6px;
        }

          .label {
          width: 80px;
          font-size: 13px;
          color: #555;
        }

          .value {
          flex: 1;
          font-size: 13px;
        }

          .input,
          .select {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid #cfcfcf;
          background: #fff;
          font-size: 13px;
        }

          .textarea-box {
          margin-top: 8px;
          border: 1px solid #cfcfcf;
          background: #fff;
        }

          textarea {
          width: 100%;
          height: 120px;
          border: none;
          padding: 8px;
          resize: none;
          font-size: 13px;
          box-sizing: border-box;
        }

          textarea::placeholder {
          color: #999;
        }

          .button-area {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 10px;
        }

          .btn {
          min-width: 60px;
          padding: 6px 12px;
          font-size: 13px;
          border-radius: 3px;
          cursor: pointer;
          border: 1px solid #cfcfcf;
          background: #f5f5f5;
        }

          .btn.save {
          background: #f39800;
          color: #fff;
          border-color: #f39800;
        }
        `}</style>

      <div className="container">
        <div className="title">기관정보</div>

        <div className="form-box">
          <div className="row">
            <div className="label">기관명</div>
            <div className="value">
              <input className="input" type="text" value="가톨릭대 부천성모병원" readOnly />
            </div>
          </div>

          <div className="row">
            <div className="label">기관상태</div>
            <div className="value">
              <input className="input" type="text" value="참여요청" readOnly />
            </div>
            <div style={{ width: 12 }}></div>
            <div className="label">처리구분</div>
            <div className="value">
              <select className="select">
                <option>참여취소</option>
                <option>참여승인</option>
              </select>
            </div>
          </div>
        </div>

        <div className="textarea-box">
          <textarea placeholder="사유정보를 입력하여 주시기 바랍니다."></textarea>
        </div>

        <div className="button-area">
          <button className="btn">닫기</button>
          <button className="btn save">저장</button>
        </div>
      </div>
    </>
  );
}
