// ZIP readers return a decoded string. A byte-order mark is no longer XML content.
// Some WebKit ports reject U+FEFF before the XML declaration, unlike Chromium.
export function parseWorkbookXml(source,part='worksheet'){
 const text=source.charCodeAt(0)===0xFEFF?source.slice(1):source;
 const doc=new DOMParser().parseFromString(text,'application/xml');
 const error=doc.getElementsByTagName('parsererror')[0];
 if(error)throw Error(`엑셀 XML을 읽을 수 없습니다 (${part}): ${error.textContent.trim().slice(0,300)}`);
 return doc;
}
