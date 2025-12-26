// Updated ReceiptPage component using html2pdf.js
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import NotFoundPage from "../404_page";
import { fetchWithTimeout, handleFetchError } from "../../utils/fetchUtils";
import { API_ENDPOINTS } from "../../apiConfig";
import html2pdf from "html2pdf.js";

const ReceiptPage = () => {
  const { receipt_id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPrintBtn, setShowPrintBtn] = useState(true);
  const receiptRef = useRef();

  const numberToWords = (num) => {
    // Convert only whole numbers, ignore decimals
    const wholeNum = Math.floor(num);

    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

    const convertHundreds = (n) => {
      let result = "";
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + " hundred ";
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + " ";
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + " ";
        return result;
      }
      if (n > 0) {
        result += ones[n] + " ";
      }
      return result;
    };

    if (wholeNum === 0) return "zero";
    let result = "";
    let billion = Math.floor(wholeNum / 1000000000);
    let million = Math.floor((wholeNum % 1000000000) / 1000000);
    let thousand = Math.floor((wholeNum % 1000000) / 1000);
    let remainder = wholeNum % 1000;

    if (billion > 0) result += convertHundreds(billion) + "billion ";
    if (million > 0) result += convertHundreds(million) + "million ";
    if (thousand > 0) result += convertHundreds(thousand) + "thousand ";
    if (remainder > 0) result += convertHundreds(remainder);

    return result.trim();
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);
    setError(null);
    fetchWithTimeout(API_ENDPOINTS.GET_RECEIPT(receipt_id), {}, 20000)
      .then(async (res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        const responseData = await res.json();
        const data = responseData.data;
        if (responseData.success === false || !data.receipt_id) {
          if (isMounted) setNotFound(true);
        } else {
          if (isMounted) setReceipt(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          const handled = handleFetchError(err);
          setError(handled.message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [receipt_id]);

  const handlePrint = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setShowPrintBtn(false);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const element = receiptRef.current;
    const opt = {
      margin: 0,
      filename: `${receipt.receipt_no}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all"] }
    };

    await html2pdf().set(opt).from(element).save();

    setTimeout(() => {
      setShowPrintBtn(true);
      setIsDownloading(false);
    }, 1000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading receipt...</div>;
  if (notFound) return <NotFoundPage message="Receipt not found." />;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">{error}</div>;

  const themeColor = receipt.association_theme_color || "#0066CC";
  const logo = receipt.association_logo;

  // Calculate amount in words with kobo handling
  const amount = Number(receipt.amount_paid);
  const naira = Math.floor(amount);
  const kobo = Math.round((amount - naira) * 100);

  let amountInWords = numberToWords(naira);
  if (kobo > 0) {
    amountInWords += ` naira, ${numberToWords(kobo)} kobo`;
  } else {
    amountInWords += " naira only";
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <div
          ref={receiptRef}
          className="receipt-content"
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            width: "100%",
            maxWidth: "800px",
            height: "auto",
            minHeight: "450px",
            margin: "0 auto",
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
            fontSize: "14px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transformOrigin: "top center",
            // Mobile responsive scaling
            transform: window.innerWidth < 768 ? "scale(0.85)" : "scale(1)",
            marginBottom: window.innerWidth < 768 ? "20px" : "0"
          }}
        >
          {/* Header Section */}
          <div
            style={{
              background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
              color: "white",
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTopLeftRadius: "12px",
              borderTopRightRadius: "12px",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", flex: "1", minWidth: "200px" }}>
              {logo && (
                <img
                  src={logo}
                  alt="Logo"
                  crossOrigin="anonymous"
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginRight: "12px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    background: "#fff",
                    flexShrink: 0
                  }}
                />
              )}
              <div>
                <div style={{
                  fontWeight: "700",
                  fontSize: "16px",
                  letterSpacing: "0.5px",
                  marginBottom: "2px",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  lineHeight: "1.2"
                }}>
                  {receipt.association_name}
                </div>
                <div style={{
                  fontSize: "11px",
                  opacity: "0.9",
                  letterSpacing: "1px"
                }}>
                  {receipt.association_short_name?.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{
                fontWeight: "700",
                fontSize: "16px",
                marginBottom: "4px",
                letterSpacing: "1px"
              }}>
                RECEIPT
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{
            flex: 1,
            padding: "20px 24px",
            position: "relative",
            background: "#ffffff"
          }}>

            {/* Watermark */}
            {logo && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: "0.09",
                pointerEvents: "none",
                zIndex: 1,
              }}>
                <img
                  src={logo}
                  alt="Watermark"
                  crossOrigin="anonymous"
                  style={{
                    width: "240px",
                    height: "240px",
                    objectFit: "contain"
                  }}
                />
              </div>
            )}

            {/* Receipt No (far left) and Date (far right) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                width: "100%",
              }}
            >
              {/* Receipt No */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  RECEIPT NO:
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    color: "#374151",
                    marginLeft: "8px",
                  }}
                >
                  {receipt.receipt_no}
                </span>
              </div>
              {/* Date */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  DATE:
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#374151",
                    marginLeft: "8px",
                  }}
                >
                  {new Date(receipt.issued_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Content Layout (bordered box, does NOT include receipt no/date) */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
              zIndex: 2,
              maxWidth: "100%",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
              background: "#fafbfc66",
            }}>
              {/* Session Title */}
              {receipt.session_title && (
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  flexWrap: "wrap"
                }}>
                  <div style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    width: "140px",
                    textAlign: "left",
                    flexShrink: 0,
                  }}>
                    SESSION:
                  </div>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#374151",
                    lineHeight: "1.4",
                    flex: "1",
                    minWidth: "200px",
                    marginLeft: "0",
                    wordWrap: "break-word",
                    overflowWrap: "break-word"
                  }}>
                    {receipt.session_title}
                  </div>
                </div>
              )}

              {/* Payment From */}
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "140px",
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  PAYMENT FROM:
                </div>
                <div style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#111827",
                  flex: "1",
                  minWidth: "200px",
                  marginLeft: "0",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  {receipt.payer_first_name} {receipt.payer_last_name}
                </div>
              </div>

              {/* level */}
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "140px",
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  LEVEL:
                </div>
                <div style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#111827",
                  flex: "1",
                  minWidth: "200px",
                  marginLeft: "0",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  {receipt.payer_level} Level
                </div>
              </div>

              {/* Items Paid */}
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "140px",
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  ITEMS PAID:
                </div>
                <div style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#374151",
                  lineHeight: "1.4",
                  flex: "1",
                  minWidth: "200px",
                  marginLeft: "0",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  {receipt.items_paid.join(" • ")}
                </div>
              </div>
              {/* Amount in words */}
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "140px",
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  AMOUNT IN WORDS:
                </div>
                <div style={{ flex: "1", minWidth: "200px", marginLeft: "0" }}>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#374151",
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: "4px",
                    textTransform: "capitalize"
                  }}>
                    {amountInWords}
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "140px",
                  textAlign: "left",
                  flexShrink: 0,
                }}>
                  AMOUNT:
                </div>
                <div style={{ flex: "1", minWidth: "200px", marginLeft: "0" }}>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: themeColor,
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: "4px"
                  }}>
                    ₦{Number(receipt.amount_paid).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div style={{
              position: "absolute",
              bottom: "5px",
              right: "24px",
              textAlign: "right"
            }}>
              <div style={{
                width: "120px",
                height: "1px",
                background: "#d1d5db",
                marginBottom: "6px",
                marginLeft: "auto"
              }}></div>
              <div style={{
                fontSize: "9px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                AUTHORIZED SIGNATURE
              </div>
            </div>
          </div>

          {/* Bottom Border */}
          <div style={{
            height: "4px",
            background: `linear-gradient(90deg, ${themeColor} 0%, ${themeColor}aa 100%)`,
            borderBottomLeftRadius: "12px",
            borderBottomRightRadius: "12px"
          }}></div>
        </div>

        {/* Download PDF Button */}
        <div className="text-center mt-6">
          <button
            onClick={handlePrint}
            disabled={isDownloading}
            style={{
              background: isDownloading ? "#9ca3af" : themeColor,
              color: "white",
              padding: "12px 24px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: isDownloading ? "not-allowed" : "pointer",
              opacity: isDownloading ? 0.7 : 1,
              transition: "opacity 0.2s"
            }}
          >
            {isDownloading ? (
              <span>
                <span className="animate-spin" style={{ display: "inline-block", marginRight: 8 }}>
                  {/* Simple spinner SVG */}
                  <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff">
                    <g fill="none" fillRule="evenodd">
                      <g transform="translate(1 1)" strokeWidth="3">
                        <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
                        <path d="M36 18c0-9.94-8.06-18-18-18">
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 18 18"
                            to="360 18 18"
                            dur="1s"
                            repeatCount="indefinite" />
                        </path>
                      </g>
                    </g>
                  </svg>
                </span>
                Preparing PDF...
              </span>
            ) : (
              "Download PDF"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
