/**
 * The briefing meter: FREE_BRIEFINGS full briefings a calendar month, counted in the reader's
 * browser (localStorage), then the rest of each new briefing is behind the subscribe card.
 * Members carry an ACCESS_COOKIE whose value is when their access next needs re-checking with
 * Stripe; it is readable here on purpose and proves nothing on the server.
 *
 * It's a soft paywall, like most news sites': the full text is in the page for search engines,
 * and clearing site data resets the count.
 */

export const FREE_BRIEFINGS = 3;
export const PRICE_LABEL = "$2 a month";
export const ACCESS_COOKIE = "cw_access";
/** Fired on window when the Paywall has recorded a read. */
export const METER_EVENT = "cw-meter";

export type MeterState = {
  member: boolean;
  /** Had access that needs re-checking with Stripe; treated as open meanwhile. */
  recheck: boolean;
  /** This briefing is readable in full. */
  open: boolean;
  read: number;
  left: number;
};

declare global {
  interface Window {
    /** Reads the meter, records `id` when `record` and it fits, and sets html[data-paywall]. */
    cwMeter?: (id: string | null, record: boolean) => MeterState;
  }
}

/**
 * Runs in <head> before the page paints, so a locked briefing never flashes its full text.
 * On first load it reads the meter for the briefing in the URL without recording it; the
 * Paywall component records the read once it knows the page really is a briefing.
 */
export const METER_SCRIPT = `(function(){
var FREE=${FREE_BRIEFINGS};
window.cwMeter=function(id,record){
  var s={member:false,recheck:false,open:true,read:0,left:FREE};
  try{
    var m=document.cookie.match(/(?:^|; )${ACCESS_COOKIE}=(\\d+)/);
    if(m&&+m[1]>Date.now()){s.member=true}
    else{
      s.recheck=!!m;
      var month=new Date().toISOString().slice(0,7);
      var d=JSON.parse(localStorage.getItem("cw-meter")||"null");
      if(!d||d.month!==month||!Array.isArray(d.ids))d={month:month,ids:[]};
      var seen=id&&d.ids.indexOf(id)>=0;
      if(id&&record&&!seen&&!s.recheck&&d.ids.length<FREE){d.ids.push(id);seen=true;localStorage.setItem("cw-meter",JSON.stringify(d))}
      s.read=d.ids.length;s.left=Math.max(0,FREE-d.ids.length);
      s.open=!id||seen||d.ids.length<FREE||s.recheck;
    }
  }catch(e){}
  if(id)document.documentElement.setAttribute("data-paywall",s.open?"open":"locked");
  return s;
};
var p=location.pathname.match(/^\\/story\\/([^\\/?#]+)/);
window.cwMeter(p?p[1]:null,false);
})();`;
