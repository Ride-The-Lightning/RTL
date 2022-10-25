"use strict";(self.webpackChunkRTLApp=self.webpackChunkRTLApp||[]).push([[267],{1203:(G,b,r)=>{r.d(b,{D:()=>O});var e=r(7579),x=r(2722),M=r(7731),C=r(8377),c=r(5e3),a=r(62),R=r(5620),V=r(3251),g=r(9808),H=r(7093),S=r(5245),y=r(7238);function T(u,_){if(1&u&&(c.TgZ(0,"mat-icon",9),c._uU(1,"info_outline"),c.qZA()),2&u){const m=c.oxw().$implicit;c.Q6J("matTooltip",m.tooltip)}}function N(u,_){if(1&u&&(c.TgZ(0,"span",10),c._uU(1),c.ALo(2,"number"),c.qZA()),2&u){const m=c.oxw().$implicit;c.xp6(1),c.hij(" ",c.lcZ(2,1,m.dataValue)," ")}}function F(u,_){if(1&u&&(c.TgZ(0,"span",10),c._uU(1),c.ALo(2,"number"),c.qZA()),2&u){const m=c.oxw().$implicit,o=c.oxw(2);c.xp6(1),c.hij(" ",c.xi3(2,1,m[o.currencyUnitEnum.BTC],o.currencyUnitFormats.BTC)," ")}}function D(u,_){if(1&u&&(c.TgZ(0,"span",10),c._uU(1),c.ALo(2,"number"),c.qZA()),2&u){const m=c.oxw().$implicit,o=c.oxw(2);c.xp6(1),c.hij(" ",c.xi3(2,1,m[o.currencyUnitEnum.OTHER],o.currencyUnitFormats.OTHER)," ")}}function w(u,_){if(1&u&&(c.TgZ(0,"div",5)(1,"div",6),c._uU(2),c.YNc(3,T,2,1,"mat-icon",7),c.qZA(),c.YNc(4,N,3,3,"span",8),c.YNc(5,F,3,4,"span",8),c.YNc(6,D,3,4,"span",8),c.qZA()),2&u){const m=_.$implicit,o=c.oxw().$implicit,p=c.oxw();c.xp6(2),c.hij(" ",m.title," "),c.xp6(1),c.Q6J("ngIf",m.tooltip),c.xp6(1),c.Q6J("ngIf",o===p.currencyUnitEnum.SATS),c.xp6(1),c.Q6J("ngIf",o===p.currencyUnitEnum.BTC),c.xp6(1),c.Q6J("ngIf",p.fiatConversion&&o!==p.currencyUnitEnum.SATS&&o!==p.currencyUnitEnum.BTC&&""===p.conversionErrorMsg)}}function E(u,_){if(1&u&&(c.TgZ(0,"div",11)(1,"div",12),c._uU(2),c.qZA()()),2&u){const m=c.oxw(2);c.xp6(2),c.Oqu(m.conversionErrorMsg)}}function A(u,_){if(1&u&&(c.TgZ(0,"mat-tab",1)(1,"div",2),c.YNc(2,w,7,5,"div",3),c.qZA(),c.YNc(3,E,3,1,"div",4),c.qZA()),2&u){const m=_.$implicit,o=c.oxw();c.s9C("label",m),c.xp6(2),c.Q6J("ngForOf",o.values),c.xp6(1),c.Q6J("ngIf",o.fiatConversion&&m!==o.currencyUnitEnum.SATS&&m!==o.currencyUnitEnum.BTC&&""!==o.conversionErrorMsg)}}let O=(()=>{class u{constructor(m,o){this.commonService=m,this.store=o,this.values=[],this.currencyUnitEnum=M.NT,this.currencyUnitFormats=M.Xz,this.currencyUnits=[],this.fiatConversion=!1,this.conversionErrorMsg="",this.unSubs=[new e.x,new e.x,new e.x]}ngOnInit(){this.store.select(C.dT).pipe((0,x.R)(this.unSubs[0])).subscribe(m=>{this.fiatConversion=m.settings.fiatConversion,this.currencyUnits=m.settings.currencyUnits,this.fiatConversion||this.currencyUnits.splice(2,1),this.currencyUnits.length>1&&this.values[0]&&this.values[0].dataValue>=0&&this.getCurrencyValues(this.values)})}ngOnChanges(){this.currencyUnits.length>1&&this.values[0]&&this.values[0].dataValue>=0&&this.getCurrencyValues(this.values)}getCurrencyValues(m){m.forEach(o=>{o.dataValue>0?(this.commonService.convertCurrency(o.dataValue,M.NT.SATS,M.NT.BTC,"",!0).pipe((0,x.R)(this.unSubs[1])).subscribe(p=>{o[M.NT.BTC]=p.BTC}),this.commonService.convertCurrency(o.dataValue,M.NT.SATS,M.NT.OTHER,this.currencyUnits[2],this.fiatConversion).pipe((0,x.R)(this.unSubs[2])).subscribe({next:p=>{o[M.NT.OTHER]=p.OTHER},error:p=>{this.conversionErrorMsg="Conversion Error: "+p}})):(o[M.NT.BTC]=o.dataValue,""===this.conversionErrorMsg&&(o[M.NT.OTHER]=o.dataValue))})}ngOnDestroy(){this.unSubs.forEach(m=>{m.next(null),m.complete()})}}return u.\u0275fac=function(m){return new(m||u)(c.Y36(a.v),c.Y36(R.yh))},u.\u0275cmp=c.Xpm({type:u,selectors:[["rtl-currency-unit-converter"]],inputs:{values:"values"},features:[c.TTD],decls:2,vars:1,consts:[[3,"label",4,"ngFor","ngForOf"],[3,"label"],["fxLayout","row","fxFlex","100","fxLayoutAlign","start start"],["fxLayout","column","fxLayoutAlign","center start","class","cc-data-block",4,"ngFor","ngForOf"],["fxLayout","row","fxFlex","100","class","p-1 error-border mt-1",4,"ngIf"],["fxLayout","column","fxLayoutAlign","center start",1,"cc-data-block"],["fxLayout","row","fxFlex","100","fxLayoutAlign","start center",1,"cc-data-title"],["matTooltipPosition","below","class","info-icon",3,"matTooltip",4,"ngIf"],["class","cc-data-value",4,"ngIf"],["matTooltipPosition","below",1,"info-icon",3,"matTooltip"],[1,"cc-data-value"],["fxLayout","row","fxFlex","100",1,"p-1","error-border","mt-1"],[1,"cc-data-block"]],template:function(m,o){1&m&&(c.TgZ(0,"mat-tab-group"),c.YNc(1,A,4,3,"mat-tab",0),c.qZA()),2&m&&(c.xp6(1),c.Q6J("ngForOf",o.currencyUnits))},directives:[V.SP,g.sg,V.uX,H.xw,H.yH,H.Wh,g.O5,S.Hw,y.gM],pipes:[g.JJ],styles:[""]}),u})()},9122:(G,b,r)=>{r.d(b,{n:()=>m});var e=r(8966),x=r(2687),M=r(7731),C=r(5e3),c=r(5043),a=r(62),R=r(7261),V=r(7093),g=r(9808),H=r(3322),S=r(159),y=r(9224),T=r(9546),N=r(7423),F=r(4834),D=r(3390),w=r(6895);const E=function(o){return{"display-none":o}};function A(o,p){if(1&o&&(C.TgZ(0,"div",20),C._UZ(1,"qr-code",21),C.qZA()),2&o){const h=C.oxw();C.Q6J("ngClass",C.VKq(4,E,h.screenSize===h.screenSizeEnum.XS||h.screenSize===h.screenSizeEnum.SM)),C.xp6(1),C.Q6J("value",h.address)("size",h.qrWidth)("errorCorrectionLevel","L")}}function O(o,p){if(1&o&&(C.TgZ(0,"div",22),C._UZ(1,"qr-code",21),C.qZA()),2&o){const h=C.oxw();C.Q6J("ngClass",C.VKq(4,E,h.screenSize!==h.screenSizeEnum.XS&&h.screenSize!==h.screenSizeEnum.SM)),C.xp6(1),C.Q6J("value",h.address)("size",h.qrWidth)("errorCorrectionLevel","L")}}function u(o,p){if(1&o&&(C.TgZ(0,"div",13)(1,"div",14)(2,"h4",15),C._uU(3,"Address Type"),C.qZA(),C.TgZ(4,"span",23),C._uU(5),C.qZA()()()),2&o){const h=C.oxw();C.xp6(5),C.Oqu(h.addressType)}}function _(o,p){1&o&&C._UZ(0,"mat-divider",17)}let m=(()=>{class o{constructor(h,v,P,k,U){this.dialogRef=h,this.data=v,this.logger=P,this.commonService=k,this.snackBar=U,this.faReceipt=x.dLy,this.address="",this.addressType="",this.qrWidth=230,this.screenSize="",this.screenSizeEnum=M.cu}ngOnInit(){this.address=this.data.address,this.addressType=this.data.addressType,this.screenSize=this.commonService.getScreenSize()}onClose(){this.dialogRef.close(!1)}onCopyAddress(h){this.snackBar.open("Generated address copied."),this.logger.info("Copied Text: "+h)}}return o.\u0275fac=function(h){return new(h||o)(C.Y36(e.so),C.Y36(e.WI),C.Y36(c.mQ),C.Y36(a.v),C.Y36(R.ux))},o.\u0275cmp=C.Xpm({type:o,selectors:[["rtl-on-chain-generated-address"]],decls:25,vars:8,consts:[["fxLayout","column","fxLayout.gt-sm","row","fxLayoutAlign","space-between stretch"],["fxFlex","35","fxLayoutAlign","center start","class","modal-qr-code-container padding-gap-large",3,"ngClass",4,"ngIf"],["fxFlex","65"],["fxLayout","row","fxLayoutAlign","space-between center",1,"modal-info-header"],["fxFlex","95","fxLayoutAlign","start start"],[1,"page-title-img","mr-1",3,"icon"],[1,"page-title"],["tabindex","2","fxFlex","5","fxLayoutAlign","center","mat-button","",1,"btn-close-x","p-0",3,"click"],[1,"padding-gap-x-large"],["fxLayout","column"],["fxFlex","50","fxLayoutAlign","center start","class","modal-qr-code-container padding-gap-large",3,"ngClass",4,"ngIf"],["fxLayout","row",4,"ngIf"],["class","w-100 my-1",4,"ngIf"],["fxLayout","row"],["fxFlex","100"],["fxLayoutAlign","start",1,"font-bold-500"],[1,"overflow-wrap","foreground-secondary-text"],[1,"w-100","my-1"],["fxLayout","row","fxLayoutAlign","end center",1,"mt-1"],["autoFocus","","mat-button","","color","primary","tabindex","1","type","submit","rtlClipboard","",3,"payload","copied"],["fxFlex","35","fxLayoutAlign","center start",1,"modal-qr-code-container","padding-gap-large",3,"ngClass"],[3,"value","size","errorCorrectionLevel"],["fxFlex","50","fxLayoutAlign","center start",1,"modal-qr-code-container","padding-gap-large",3,"ngClass"],[1,"foreground-secondary-text"]],template:function(h,v){1&h&&(C.TgZ(0,"div",0),C.YNc(1,A,2,6,"div",1),C.TgZ(2,"div",2)(3,"mat-card-header",3)(4,"div",4),C._UZ(5,"fa-icon",5),C.TgZ(6,"span",6),C._uU(7),C.qZA()(),C.TgZ(8,"button",7),C.NdJ("click",function(){return v.onClose()}),C._uU(9,"X"),C.qZA()(),C.TgZ(10,"mat-card-content",8)(11,"div",9),C.YNc(12,O,2,6,"div",10),C.YNc(13,u,6,1,"div",11),C.YNc(14,_,1,0,"mat-divider",12),C.TgZ(15,"div",13)(16,"div",14)(17,"h4",15),C._uU(18,"Address"),C.qZA(),C.TgZ(19,"span",16),C._uU(20),C.qZA()()(),C._UZ(21,"mat-divider",17),C.TgZ(22,"div",18)(23,"button",19),C.NdJ("copied",function(k){return v.onCopyAddress(k)}),C._uU(24,"Copy Address"),C.qZA()()()()()()),2&h&&(C.xp6(1),C.Q6J("ngIf",v.address),C.xp6(4),C.Q6J("icon",v.faReceipt),C.xp6(2),C.Oqu(v.screenSize===v.screenSizeEnum.XS?"Address":"Generated Address"),C.xp6(5),C.Q6J("ngIf",v.address),C.xp6(1),C.Q6J("ngIf",""!==v.addressType),C.xp6(1),C.Q6J("ngIf",""!==v.addressType),C.xp6(6),C.Oqu(v.address),C.xp6(3),C.Q6J("payload",v.address))},directives:[V.xw,V.Wh,g.O5,V.yH,g.mk,H.oO,S.uU,y.dk,T.BN,N.lW,y.dn,F.d,D.h,w.y],styles:[""]}),o})()},7671:(G,b,r)=>{r.d(b,{D:()=>W});var e=r(5e3),x=r(113),M=r(7731),C=r(5043),c=r(7093),a=r(7423),R=r(5245),V=r(9808),g=r(4107),H=r(3075),S=r(508),y=r(7322);let T=(()=>{class l extends S.LF{format(n,s){return"MMM YYYY"===s?M.gg[n.getMonth()].name+", "+n.getFullYear():"YYYY"===s?n.getFullYear().toString():n.getDate()+"/"+M.gg[n.getMonth()].name+"/"+n.getFullYear()}}return l.\u0275fac=function(){let L;return function(s){return(L||(L=e.n5z(l)))(s||l)}}(),l.\u0275prov=e.Yz7({token:l,factory:l.\u0275fac}),l})();const N={parse:{dateInput:"LL"},display:{dateInput:"MMM YYYY",monthYearLabel:"YYYY",dateA11yLabel:"LL",monthYearA11yLabel:"YYYY"}},F={parse:{dateInput:"LL"},display:{dateInput:"YYYY",monthYearLabel:"YYYY",dateA11yLabel:"LL",monthYearA11yLabel:"YYYY"}};let D=(()=>{class l{}return l.\u0275fac=function(n){return new(n||l)},l.\u0275dir=e.lG2({type:l,selectors:[["","monthlyDate",""]],features:[e._Bn([{provide:S._A,useClass:T},{provide:S.sG,useValue:N}])]}),l})(),w=(()=>{class l{}return l.\u0275fac=function(n){return new(n||l)},l.\u0275dir=e.lG2({type:l,selectors:[["","yearlyDate",""]],features:[e._Bn([{provide:S._A,useClass:T},{provide:S.sG,useValue:F}])]}),l})();var E=r(7531),A=r(6856),O=r(6534),u=r(9843);const _=["monthlyDatepicker"],m=["yearlyDatepicker"],o=function(){return{animationDirection:"forward"}};function p(l,L){if(1&l&&e.GkF(0,9),2&l){e.oxw();const n=e.MAs(19);e.Q6J("ngTemplateOutlet",n)("ngTemplateOutletContext",e.DdM(2,o))}}const h=function(){return{animationDirection:"backward"}};function v(l,L){if(1&l&&e.GkF(0,9),2&l){e.oxw();const n=e.MAs(19);e.Q6J("ngTemplateOutlet",n)("ngTemplateOutletContext",e.DdM(2,h))}}const P=function(){return{animationDirection:""}};function k(l,L){if(1&l&&e.GkF(0,9),2&l){e.oxw();const n=e.MAs(19);e.Q6J("ngTemplateOutlet",n)("ngTemplateOutletContext",e.DdM(2,P))}}function U(l,L){if(1&l&&(e.TgZ(0,"mat-option",17),e._uU(1),e.ALo(2,"titlecase"),e.qZA()),2&l){const n=L.$implicit;e.Q6J("value",n),e.xp6(1),e.hij(" ",e.lcZ(2,2,n)," ")}}function Y(l,L){if(1&l){const n=e.EpF();e.TgZ(0,"mat-form-field",18)(1,"input",19,20),e.NdJ("ngModelChange",function(t){return e.CHM(n),e.oxw(2).selectedValue=t}),e.qZA(),e._UZ(3,"mat-datepicker-toggle",21),e.TgZ(4,"mat-datepicker",22,23),e.NdJ("monthSelected",function(t){return e.CHM(n),e.oxw(2).onMonthSelected(t)})("dateSelected",function(t){return e.CHM(n),e.oxw(2).onMonthSelected(t)}),e.qZA()()}if(2&l){const n=e.MAs(5),s=e.oxw(2);e.xp6(1),e.Q6J("matDatepicker",n)("min",s.first)("max",s.last)("ngModel",s.selectedValue),e.xp6(2),e.Q6J("for",n),e.xp6(1),e.Q6J("startAt",s.selectedValue)}}function B(l,L){if(1&l){const n=e.EpF();e.TgZ(0,"mat-form-field",24)(1,"input",25,26),e.NdJ("ngModelChange",function(t){return e.CHM(n),e.oxw(2).selectedValue=t}),e.qZA(),e._UZ(3,"mat-datepicker-toggle",21),e.TgZ(4,"mat-datepicker",27,28),e.NdJ("yearSelected",function(t){return e.CHM(n),e.oxw(2).onYearSelected(t)})("monthSelected",function(t){return e.CHM(n),e.oxw(2).onYearSelected(t)})("dateSelected",function(t){return e.CHM(n),e.oxw(2).onYearSelected(t)}),e.qZA()()}if(2&l){const n=e.MAs(5),s=e.oxw(2);e.xp6(1),e.Q6J("matDatepicker",n)("min",s.first)("max",s.last)("ngModel",s.selectedValue),e.xp6(2),e.Q6J("for",n),e.xp6(1),e.Q6J("startAt",s.selectedValue)}}function I(l,L){if(1&l){const n=e.EpF();e.TgZ(0,"div",10)(1,"div",11)(2,"mat-select",12),e.NdJ("ngModelChange",function(t){return e.CHM(n),e.oxw().selScrollRange=t})("selectionChange",function(t){return e.CHM(n),e.oxw().onRangeChanged(t)}),e.YNc(3,U,3,4,"mat-option",13),e.qZA()(),e.TgZ(4,"div",14),e.YNc(5,Y,6,6,"mat-form-field",15),e.YNc(6,B,6,6,"mat-form-field",16),e.qZA()()}if(2&l){const n=e.oxw();e.Q6J("@sliderAnimation",n.animationDirection),e.xp6(2),e.Q6J("ngModel",n.selScrollRange),e.xp6(1),e.Q6J("ngForOf",n.scrollRanges),e.xp6(2),e.Q6J("ngIf",n.selScrollRange===n.scrollRanges[0]),e.xp6(1),e.Q6J("ngIf",n.selScrollRange===n.scrollRanges[1])}}let W=(()=>{class l{constructor(n){this.logger=n,this.scrollRanges=M.op,this.selScrollRange=this.scrollRanges[0],this.today=new Date(Date.now()),this.first=new Date(2018,0,1,0,0,0),this.last=new Date(this.today.getFullYear(),this.today.getMonth(),this.today.getDate(),0,0,0),this.disablePrev=!1,this.disableNext=!0,this.animationDirection="",this.selectedValue=this.last,this.stepChanged=new e.vpe}onRangeChanged(n){this.selScrollRange=n.value,this.onStepChange("LAST")}onMonthSelected(n){this.selectedValue=n,this.onStepChange("SELECTED"),this.monthlyDatepicker.close()}onYearSelected(n){this.selectedValue=n,this.onStepChange("SELECTED"),this.yearlyDatepicker.close()}onStepChange(n){switch(this.logger.info(n),n){case"FIRST":this.animationDirection="backward",this.selectedValue!==this.first&&(this.selectedValue=this.first,this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange}));break;case"PREVIOUS":this.selectedValue=this.selScrollRange===M.op[1]?new Date(this.selectedValue.getFullYear()-1,0,1,0,0,0):new Date(this.selectedValue.getFullYear(),this.selectedValue.getMonth()-1,1,0,0,0),this.animationDirection="backward",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;case"NEXT":this.selectedValue=this.selScrollRange===M.op[1]?new Date(this.selectedValue.getFullYear()+1,0,1,0,0,0):new Date(this.selectedValue.getFullYear(),this.selectedValue.getMonth()+1,1,0,0,0),this.animationDirection="forward",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;case"LAST":this.animationDirection="forward",this.selectedValue=this.last,this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;default:this.animationDirection="",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange})}this.disablePrev=this.selScrollRange===M.op[1]?this.selectedValue.getFullYear()<=this.first.getFullYear():this.selectedValue.getFullYear()<=this.first.getFullYear()&&this.selectedValue.getMonth()<=this.first.getMonth(),this.disableNext=this.selScrollRange===M.op[1]?this.selectedValue.getFullYear()>=this.last.getFullYear():this.selectedValue.getFullYear()>=this.last.getFullYear()&&this.selectedValue.getMonth()>=this.last.getMonth(),this.logger.info(this.disablePrev),this.logger.info(this.disableNext),setTimeout(()=>{this.animationDirection=""},800)}onChartMouseUp(n){"monthlyDate"===n.srcElement.name?this.monthlyDatepicker.open():"yearlyDate"===n.srcElement.name&&this.yearlyDatepicker.open()}}return l.\u0275fac=function(n){return new(n||l)(e.Y36(C.mQ))},l.\u0275cmp=e.Xpm({type:l,selectors:[["rtl-horizontal-scroller"]],viewQuery:function(n,s){if(1&n&&(e.Gf(_,5),e.Gf(m,5)),2&n){let t;e.iGM(t=e.CRH())&&(s.monthlyDatepicker=t.first),e.iGM(t=e.CRH())&&(s.yearlyDatepicker=t.first)}},hostBindings:function(n,s){1&n&&e.NdJ("click",function(f){return s.onChartMouseUp(f)})},outputs:{stepChanged:"stepChanged"},decls:20,vars:5,consts:[["fxLayout","row","fxLayoutAlign","space-between stretch","fxFlex","100",1,"padding-gap-x"],["fxLayout","row","fxLayoutAlign","start center","fxFlex","22"],["mat-icon-button","","color","primary","type","button","tabindex","1",1,"pr-4",3,"click"],["mat-icon-button","","color","primary","type","button","tabindex","2",3,"disabled","click"],[3,"ngTemplateOutlet","ngTemplateOutletContext",4,"ngIf"],["fxLayout","row","fxLayoutAlign","end center","fxFlex","22"],["mat-icon-button","","color","primary","type","button","tabindex","5",1,"pr-4",3,"disabled","click"],["mat-icon-button","","color","primary","type","button","tabindex","6",3,"click"],["controlsPanel",""],[3,"ngTemplateOutlet","ngTemplateOutletContext"],["fxLayout","row","fxLayoutAlign","center center","fxFlex","56"],["fxFlex","50","fxLayoutAlign","center center","fxLayoutAlign.gt-xs","end center",1,"font-bold-700"],["fxFlex","80","fxFlex.gt-md","30","name","selScrlRange","placeholder","Range","tabindex","3",1,"font-bold-700",3,"ngModel","ngModelChange","selectionChange"],[3,"value",4,"ngFor","ngForOf"],["fxFlex","50","fxLayout","row","fxLayoutAlign","center center","fxLayoutAlign.gt-xs","start center"],["monthlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center",4,"ngIf"],["yearlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center",4,"ngIf"],[3,"value"],["monthlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center"],["matInput","","name","monthlyDate","tabindex","4","readonly","",3,"matDatepicker","min","max","ngModel","ngModelChange"],["monthlyDt","ngModel"],["matSuffix","",3,"for"],["startView","year",3,"startAt","monthSelected","dateSelected"],["monthlyDatepicker",""],["yearlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center"],["matInput","","name","yearlyDate","tabindex","4","readonly","",3,"matDatepicker","min","max","ngModel","ngModelChange"],["yearlyDt","ngModel"],["startView","multi-year",3,"startAt","yearSelected","monthSelected","dateSelected"],["yearlyDatepicker",""]],template:function(n,s){1&n&&(e.TgZ(0,"div",0)(1,"div",1)(2,"button",2),e.NdJ("click",function(){return s.onStepChange("FIRST")}),e.TgZ(3,"mat-icon"),e._uU(4,"skip_previous"),e.qZA()(),e.TgZ(5,"button",3),e.NdJ("click",function(){return s.onStepChange("PREVIOUS")}),e.TgZ(6,"mat-icon"),e._uU(7,"navigate_before"),e.qZA()()(),e.YNc(8,p,1,3,"ng-container",4),e.YNc(9,v,1,3,"ng-container",4),e.YNc(10,k,1,3,"ng-container",4),e.TgZ(11,"div",5)(12,"button",6),e.NdJ("click",function(){return s.onStepChange("NEXT")}),e.TgZ(13,"mat-icon"),e._uU(14,"navigate_next"),e.qZA()(),e.TgZ(15,"button",7),e.NdJ("click",function(){return s.onStepChange("LAST")}),e.TgZ(16,"mat-icon"),e._uU(17,"skip_next"),e.qZA()()()(),e.YNc(18,I,7,5,"ng-template",null,8,e.W1O)),2&n&&(e.xp6(5),e.Q6J("disabled",s.disablePrev),e.xp6(3),e.Q6J("ngIf","forward"===s.animationDirection),e.xp6(1),e.Q6J("ngIf","backward"===s.animationDirection),e.xp6(1),e.Q6J("ngIf",""===s.animationDirection),e.xp6(2),e.Q6J("disabled",s.disableNext))},directives:[c.xw,c.Wh,c.yH,a.lW,R.Hw,V.O5,V.tP,g.gD,H.JJ,H.On,V.sg,S.ey,y.KE,D,E.Nt,A.hl,O.q,u.F,H.Fj,A.nW,y.R9,A.Mq,w],pipes:[V.rS],styles:[""],data:{animation:[x.l]}}),l})()},165:(G,b,r)=>{r.d(b,{g:()=>s});var e=r(6087),x=r(4847),M=r(2075),C=r(7731),c=r(7861),a=r(5e3),R=r(62),V=r(5620),g=r(9808),H=r(7093),S=r(7322),y=r(7531),T=r(3075),N=r(8129),F=r(4107),D=r(508),w=r(7423),E=r(3322);function A(t,f){1&t&&(a.TgZ(0,"th",27),a._uU(1,"Date"),a.qZA())}function O(t,f){if(1&t&&(a.TgZ(0,"td",28),a._uU(1),a.ALo(2,"date"),a.qZA()),2&t){const i=f.$implicit,d=a.oxw();a.xp6(1),a.Oqu(a.xi3(2,1,null==i?null:i.date,d.dataRange===d.scrollRanges[1]?"MMM/yyyy":"dd/MMM/yyyy"))}}function u(t,f){1&t&&(a.TgZ(0,"th",29),a._uU(1,"Amount Paid (Sats)"),a.qZA())}function _(t,f){if(1&t&&(a.TgZ(0,"td",28)(1,"span",30),a._uU(2),a.ALo(3,"number"),a.qZA()()),2&t){const i=f.$implicit;a.xp6(2),a.Oqu(a.xi3(3,1,null==i?null:i.amount_paid,"1.0-2"))}}function m(t,f){1&t&&(a.TgZ(0,"th",29),a._uU(1,"# Payments"),a.qZA())}function o(t,f){if(1&t&&(a.TgZ(0,"td",28)(1,"span",30),a._uU(2),a.ALo(3,"number"),a.qZA()()),2&t){const i=f.$implicit;a.xp6(2),a.Oqu(a.lcZ(3,1,null==i?null:i.num_payments))}}function p(t,f){1&t&&(a.TgZ(0,"th",29),a._uU(1,"Amount Received (Sats)"),a.qZA())}function h(t,f){if(1&t&&(a.TgZ(0,"td",28)(1,"span",30),a._uU(2),a.ALo(3,"number"),a.qZA()()),2&t){const i=f.$implicit;a.xp6(2),a.Oqu(a.xi3(3,1,null==i?null:i.amount_received,"1.0-2"))}}function v(t,f){1&t&&(a.TgZ(0,"th",29),a._uU(1,"# Invoices"),a.qZA())}function P(t,f){if(1&t&&(a.TgZ(0,"td",28)(1,"span",30),a._uU(2),a.ALo(3,"number"),a.qZA()()),2&t){const i=f.$implicit;a.xp6(2),a.Oqu(a.lcZ(3,1,null==i?null:i.num_invoices))}}function k(t,f){if(1&t){const i=a.EpF();a.TgZ(0,"th",31)(1,"div",32)(2,"mat-select",33),a._UZ(3,"mat-select-trigger"),a.TgZ(4,"mat-option",34),a.NdJ("click",function(){return a.CHM(i),a.oxw().onDownloadCSV()}),a._uU(5,"Download CSV"),a.qZA()()()()}}function U(t,f){if(1&t){const i=a.EpF();a.TgZ(0,"td",35)(1,"button",36),a.NdJ("click",function(){const Z=a.CHM(i).$implicit;return a.oxw().onTransactionClick(Z)}),a._uU(2,"View Info"),a.qZA()()}}function Y(t,f){1&t&&(a.TgZ(0,"p"),a._uU(1,"No transaction available."),a.qZA())}function B(t,f){if(1&t&&(a.TgZ(0,"td",37),a.YNc(1,Y,2,0,"p",38),a.qZA()),2&t){const i=a.oxw();a.xp6(1),a.Q6J("ngIf",!(null!=i.transactions&&i.transactions.data)||(null==i.transactions||null==i.transactions.data?null:i.transactions.data.length)<1)}}const I=function(t){return{"display-none":t}};function W(t,f){if(1&t&&a._UZ(0,"tr",39),2&t){const i=a.oxw();a.Q6J("ngClass",a.VKq(1,I,(null==i.transactions?null:i.transactions.data)&&(null==i.transactions||null==i.transactions.data?null:i.transactions.data.length)>0))}}function l(t,f){1&t&&a._UZ(0,"tr",40)}function L(t,f){1&t&&a._UZ(0,"tr",41)}const n=function(){return["no_transaction"]};let s=(()=>{class t{constructor(i,d,z){this.commonService=i,this.store=d,this.datePipe=z,this.dataRange=C.op[0],this.dataList=[],this.filterValue="",this.displayedColumns=["date","amount_paid","num_payments","amount_received","num_invoices"],this.tableSetting={tableId:"transactions",recordsPerPage:C.IV,sortBy:"date",sortOrder:C.Pi.DESCENDING},this.timezoneOffset=60*new Date(Date.now()).getTimezoneOffset(),this.scrollRanges=C.op,this.pageSize=C.IV,this.pageSizeOptions=C.TJ,this.screenSize="",this.screenSizeEnum=C.cu,this.screenSize=this.commonService.getScreenSize()}ngOnInit(){this.pageSize=this.tableSetting.recordsPerPage?+this.tableSetting.recordsPerPage:C.IV,this.dataList&&this.dataList.length>0&&this.loadTransactionsTable(this.dataList)}ngAfterViewInit(){this.setTableWidgets()}ngOnChanges(i){i.dataList&&!i.dataList.firstChange&&(this.pageSize=this.tableSetting.recordsPerPage?+this.tableSetting.recordsPerPage:C.IV,this.loadTransactionsTable(this.dataList)),i.filterValue&&!i.filterValue.firstChange&&this.applyFilter()}onTransactionClick(i){const d=[[{key:"date",value:this.datePipe.transform(i.date,this.dataRange===C.op[1]?"MMM/yyyy":"dd/MMM/yyyy"),title:"Date",width:100,type:C.Gi.DATE}],[{key:"amount_paid",value:Math.round(i.amount_paid),title:"Amount Paid (Sats)",width:50,type:C.Gi.NUMBER},{key:"num_payments",value:i.num_payments,title:"# Payments",width:50,type:C.Gi.NUMBER}],[{key:"amount_received",value:Math.round(i.amount_received),title:"Amount Received (Sats)",width:50,type:C.Gi.NUMBER},{key:"num_invoices",value:i.num_invoices,title:"# Invoices",width:50,type:C.Gi.NUMBER}]];this.store.dispatch((0,c.qR)({payload:{data:{type:C.n_.INFORMATION,alertTitle:"Transaction Summary",message:d}}}))}applyFilter(){this.transactions&&(this.transactions.filter=this.filterValue.trim().toLowerCase())}loadTransactionsTable(i){this.transactions=new M.by(i?[...i]:[]),this.setTableWidgets()}setTableWidgets(){var i;this.transactions&&this.transactions.data&&this.transactions.data.length>0&&(this.transactions.sortingDataAccessor=(d,z)=>d[z]&&isNaN(d[z])?d[z].toLocaleLowerCase():d[z]?+d[z]:null,this.transactions.sort=this.sort,null===(i=this.transactions.sort)||void 0===i||i.sort({id:this.tableSetting.sortBy,start:this.tableSetting.sortOrder,disableClear:!0}),this.transactions.filterPredicate=(d,z)=>((d.date?(this.datePipe.transform(d.date,"dd/MMM")+"/"+d.date.getFullYear()).toLowerCase():"")+JSON.stringify(d).toLowerCase()).includes(z),this.transactions.paginator=this.paginator)}onDownloadCSV(){this.transactions.data&&this.transactions.data.length>0&&this.commonService.downloadFile(this.dataList,"Transactions-report-"+this.dataRange.toLowerCase())}}return t.\u0275fac=function(i){return new(i||t)(a.Y36(R.v),a.Y36(V.yh),a.Y36(g.uU))},t.\u0275cmp=a.Xpm({type:t,selectors:[["rtl-transactions-report-table"]],viewQuery:function(i,d){if(1&i&&(a.Gf(x.YE,5),a.Gf(e.NW,5)),2&i){let z;a.iGM(z=a.CRH())&&(d.sort=z.first),a.iGM(z=a.CRH())&&(d.paginator=z.first)}},inputs:{dataRange:"dataRange",dataList:"dataList",filterValue:"filterValue",displayedColumns:"displayedColumns",tableSetting:"tableSetting"},features:[a._Bn([{provide:e.ye,useValue:(0,C.pt)("Transactions")}]),a.TTD],decls:34,vars:9,consts:[["fxLayout","column","fxFlex","100","fxLayoutAlign","space-between stretch",1,"padding-gap-x"],["fxLayout","column","fxLayoutAlign","start stretch"],["fxLayout","column","fxLayoutAlign","start stretch","fxLayout.gt-sm","row wrap",1,"page-sub-title-container","mt-1"],["fxFlex","70"],["fxFlex","30","fxLayoutAlign","start end"],["matInput","","name","filter","placeholder","Filter",3,"ngModel","ngModelChange","input","keyup"],["fxLayout","row","fxLayoutAlign","start start"],["fxLayout","column","fxFlex","100",1,"table-container",3,"perfectScrollbar"],["mat-table","","fxFlex","100","matSort","",1,"overflow-auto",3,"dataSource"],["table",""],["matColumnDef","date"],["mat-header-cell","","mat-sort-header","",4,"matHeaderCellDef"],["mat-cell","",4,"matCellDef"],["matColumnDef","amount_paid"],["mat-header-cell","","mat-sort-header","","arrowPosition","before",4,"matHeaderCellDef"],["matColumnDef","num_payments"],["matColumnDef","amount_received"],["matColumnDef","num_invoices"],["matColumnDef","actions"],["mat-header-cell","","class","px-3",4,"matHeaderCellDef"],["mat-cell","","class","px-3","fxLayoutAlign","end center",4,"matCellDef"],["matColumnDef","no_transaction"],["mat-footer-cell","","colspan","4",4,"matFooterCellDef"],["mat-footer-row","",3,"ngClass",4,"matFooterRowDef"],["mat-header-row","",4,"matHeaderRowDef"],["mat-row","",4,"matRowDef","matRowDefColumns"],[1,"mb-1",3,"pageSize","pageSizeOptions","showFirstLastButtons"],["mat-header-cell","","mat-sort-header",""],["mat-cell",""],["mat-header-cell","","mat-sort-header","","arrowPosition","before"],["fxLayoutAlign","end center"],["mat-header-cell","",1,"px-3"],["fxLayoutAlign","center center",1,"bordered-box","table-actions-select"],["placeholder","Actions","tabindex","1",1,"mr-0"],[3,"click"],["mat-cell","","fxLayoutAlign","end center",1,"px-3"],["mat-stroked-button","","color","primary","type","button","tabindex","4",1,"table-actions-button",3,"click"],["mat-footer-cell","","colspan","4"],[4,"ngIf"],["mat-footer-row","",3,"ngClass"],["mat-header-row",""],["mat-row",""]],template:function(i,d){1&i&&(a.TgZ(0,"div",0)(1,"div",1)(2,"div",2),a._UZ(3,"div",3),a.TgZ(4,"mat-form-field",4)(5,"input",5),a.NdJ("ngModelChange",function(Z){return d.filterValue=Z})("input",function(){return d.applyFilter()})("keyup",function(){return d.applyFilter()}),a.qZA()()(),a.TgZ(6,"div",6)(7,"div",7)(8,"table",8,9),a.ynx(10,10),a.YNc(11,A,2,0,"th",11),a.YNc(12,O,3,4,"td",12),a.BQk(),a.ynx(13,13),a.YNc(14,u,2,0,"th",14),a.YNc(15,_,4,4,"td",12),a.BQk(),a.ynx(16,15),a.YNc(17,m,2,0,"th",14),a.YNc(18,o,4,3,"td",12),a.BQk(),a.ynx(19,16),a.YNc(20,p,2,0,"th",14),a.YNc(21,h,4,4,"td",12),a.BQk(),a.ynx(22,17),a.YNc(23,v,2,0,"th",14),a.YNc(24,P,4,3,"td",12),a.BQk(),a.ynx(25,18),a.YNc(26,k,6,0,"th",19),a.YNc(27,U,3,0,"td",20),a.BQk(),a.ynx(28,21),a.YNc(29,B,2,1,"td",22),a.BQk(),a.YNc(30,W,1,3,"tr",23),a.YNc(31,l,1,0,"tr",24),a.YNc(32,L,1,0,"tr",25),a.qZA(),a._UZ(33,"mat-paginator",26),a.qZA()()()()),2&i&&(a.xp6(5),a.Q6J("ngModel",d.filterValue),a.xp6(3),a.Q6J("dataSource",d.transactions),a.xp6(22),a.Q6J("matFooterRowDef",a.DdM(8,n)),a.xp6(1),a.Q6J("matHeaderRowDef",d.displayedColumns),a.xp6(1),a.Q6J("matRowDefColumns",d.displayedColumns),a.xp6(1),a.Q6J("pageSize",d.pageSize)("pageSizeOptions",d.pageSizeOptions)("showFirstLastButtons",d.screenSize!==d.screenSizeEnum.XS))},directives:[H.xw,H.yH,H.Wh,S.KE,y.Nt,T.Fj,T.JJ,T.On,N.$V,M.BZ,x.YE,M.w1,M.fO,M.ge,x.nU,M.Dz,M.ev,F.gD,F.$L,D.ey,w.lW,M.mD,M.yh,g.O5,M.Ke,M.Q2,g.mk,E.oO,M.as,M.XQ,M.nj,M.Gk,e.NW],pipes:[g.uU,g.JJ],styles:[".mat-column-actions[_ngcontent-%COMP%]{min-height:4.8rem}"]}),t})()},3396:(G,b,r)=>{r.d(b,{KfU:()=>E2,ctA:()=>e1});var E2={prefix:"far",iconName:"face-frown",icon:[512,512,[9785,"frown"],"f119","M143.9 398.6C131.4 394.1 124.9 380.3 129.4 367.9C146.9 319.4 198.9 288 256 288C313.1 288 365.1 319.4 382.6 367.9C387.1 380.3 380.6 394.1 368.1 398.6C355.7 403.1 341.9 396.6 337.4 384.1C328.2 358.5 297.2 336 256 336C214.8 336 183.8 358.5 174.6 384.1C170.1 396.6 156.3 403.1 143.9 398.6V398.6zM208.4 208C208.4 225.7 194 240 176.4 240C158.7 240 144.4 225.7 144.4 208C144.4 190.3 158.7 176 176.4 176C194 176 208.4 190.3 208.4 208zM304.4 208C304.4 190.3 318.7 176 336.4 176C354 176 368.4 190.3 368.4 208C368.4 225.7 354 240 336.4 240C318.7 240 304.4 225.7 304.4 208zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"]},e1={prefix:"far",iconName:"face-smile",icon:[512,512,[128578,"smile"],"f118","M256 352C293.2 352 319.2 334.5 334.4 318.1C343.3 308.4 358.5 307.7 368.3 316.7C378 325.7 378.6 340.9 369.6 350.6C347.7 374.5 309.7 400 256 400C202.3 400 164.3 374.5 142.4 350.6C133.4 340.9 133.1 325.7 143.7 316.7C153.5 307.7 168.7 308.4 177.6 318.1C192.8 334.5 218.8 352 256 352zM208.4 208C208.4 225.7 194 240 176.4 240C158.7 240 144.4 225.7 144.4 208C144.4 190.3 158.7 176 176.4 176C194 176 208.4 190.3 208.4 208zM304.4 208C304.4 190.3 318.7 176 336.4 176C354 176 368.4 190.3 368.4 208C368.4 225.7 354 240 336.4 240C318.7 240 304.4 225.7 304.4 208zM512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256zM256 48C141.1 48 48 141.1 48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48z"]}}}]);