(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{"2yzq":function(t,e,n){"use strict";n.d(e,"b",function(){return i}),n.d(e,"a",function(){return c});var a=n("GS7A");const i=[Object(a.m)("opacityAnimation",[Object(a.l)(":enter",[Object(a.k)({opacity:0}),Object(a.e)("1000ms ease-in",Object(a.k)({opacity:1}))]),Object(a.l)(":leave",[Object(a.e)("0ms",Object(a.k)({opacity:0}))])])],c=[Object(a.m)("fadeIn",[Object(a.l)("void => *",[]),Object(a.l)("* => void",[]),Object(a.l)("* => *",[Object(a.e)(800,Object(a.g)([Object(a.k)({opacity:0,transform:"translateY(100%)"}),Object(a.k)({opacity:1,transform:"translateY(0%)"})]))])])]},"9wfV":function(t,e,n){"use strict";n.d(e,"a",function(){return i});var a=n("GS7A");const i=[Object(a.m)("sliderAnimation",[Object(a.j)("*",Object(a.k)({transform:"translateX(0)"})),Object(a.l)("void => backward",[Object(a.k)({transform:"translateX(-100%"}),Object(a.e)("800ms")]),Object(a.l)("backward => void",[Object(a.e)("0ms",Object(a.k)({transform:"translateX(100%)"}))]),Object(a.l)("void => forward",[Object(a.k)({transform:"translateX(100%"}),Object(a.e)("800ms")]),Object(a.l)("forward => void",[Object(a.e)("0ms",Object(a.k)({transform:"translateX(-100%)"}))])])]},LQLF:function(t,e,n){"use strict";n.d(e,"a",function(){return z});var a=n("8Y7J"),i=n("9wfV"),c=n("7nzP"),o=n("cpEJ"),s=n("VDRc"),r=n("Dxy4"),l=n("Tj54"),u=n("SVse"),d=n("ZTz/"),b=n("s7LF"),m=n("UhP/"),f=n("Q2Ze");let h=(()=>{class t extends m.t{format(t,e){return"MMM YYYY"===e?c.l[t.getMonth()].name+", "+t.getFullYear():"YYYY"===e?t.getFullYear().toString():t.getDate()+"/"+c.l[t.getMonth()].name+"/"+t.getFullYear()}}return t.\u0275fac=function(e){return g(e||t)},t.\u0275prov=a.Lb({token:t,factory:t.\u0275fac}),t})();const g=a.Xb(h),p={parse:{dateInput:"LL"},display:{dateInput:"MMM YYYY",monthYearLabel:"YYYY",dateA11yLabel:"LL",monthYearA11yLabel:"YYYY"}},y={parse:{dateInput:"LL"},display:{dateInput:"YYYY",monthYearLabel:"YYYY",dateA11yLabel:"LL",monthYearA11yLabel:"YYYY"}};let x=(()=>{class t{}return t.\u0275fac=function(e){return new(e||t)},t.\u0275dir=a.Kb({type:t,selectors:[["","monthlyDate",""]],features:[a.Cb([{provide:m.c,useClass:h},{provide:m.e,useValue:p}])]}),t})(),S=(()=>{class t{}return t.\u0275fac=function(e){return new(e||t)},t.\u0275dir=a.Kb({type:t,selectors:[["","yearlyDate",""]],features:[a.Cb([{provide:m.c,useClass:h},{provide:m.e,useValue:y}])]}),t})();var V=n("e6WT"),D=n("TN/R"),v=n("B0X+"),w=n("hNFU");const C=["monthlyDatepicker"],U=["yearlyDatepicker"],L=function(){return{animationDirection:"forward"}};function k(t,e){if(1&t&&a.Rb(0,9),2&t){a.hc();const t=a.wc(19);a.oc("ngTemplateOutlet",t)("ngTemplateOutletContext",a.rc(2,L))}}const O=function(){return{animationDirection:"backward"}};function F(t,e){if(1&t&&a.Rb(0,9),2&t){a.hc();const t=a.wc(19);a.oc("ngTemplateOutlet",t)("ngTemplateOutletContext",a.rc(2,O))}}const R=function(){return{animationDirection:""}};function T(t,e){if(1&t&&a.Rb(0,9),2&t){a.hc();const t=a.wc(19);a.oc("ngTemplateOutlet",t)("ngTemplateOutletContext",a.rc(2,R))}}function I(t,e){if(1&t&&(a.Vb(0,"mat-option",17),a.Kc(1),a.ic(2,"titlecase"),a.Ub()),2&t){const t=e.$implicit;a.oc("value",t),a.Db(1),a.Mc(" ",a.jc(2,2,t)," ")}}function A(t,e){if(1&t){const t=a.Wb();a.Vb(0,"mat-form-field",18),a.Vb(1,"input",19,20),a.dc("ngModelChange",function(e){return a.zc(t),a.hc(2).selectedValue=e}),a.Ub(),a.Qb(3,"mat-datepicker-toggle",21),a.Vb(4,"mat-datepicker",22,23),a.dc("monthSelected",function(e){return a.zc(t),a.hc(2).onMonthSelected(e)})("dateSelected",function(e){return a.zc(t),a.hc(2).onMonthSelected(e)}),a.Ub(),a.Ub()}if(2&t){const t=a.wc(5),e=a.hc(2);a.Db(1),a.oc("matDatepicker",t)("min",e.first)("max",e.last)("ngModel",e.selectedValue),a.Db(2),a.oc("for",t),a.Db(1),a.oc("startAt",e.selectedValue)}}function M(t,e){if(1&t){const t=a.Wb();a.Vb(0,"mat-form-field",24),a.Vb(1,"input",25,26),a.dc("ngModelChange",function(e){return a.zc(t),a.hc(2).selectedValue=e}),a.Ub(),a.Qb(3,"mat-datepicker-toggle",21),a.Vb(4,"mat-datepicker",27,28),a.dc("yearSelected",function(e){return a.zc(t),a.hc(2).onYearSelected(e)})("monthSelected",function(e){return a.zc(t),a.hc(2).onYearSelected(e)})("dateSelected",function(e){return a.zc(t),a.hc(2).onYearSelected(e)}),a.Ub(),a.Ub()}if(2&t){const t=a.wc(5),e=a.hc(2);a.Db(1),a.oc("matDatepicker",t)("min",e.first)("max",e.last)("ngModel",e.selectedValue),a.Db(2),a.oc("for",t),a.Db(1),a.oc("startAt",e.selectedValue)}}function Y(t,e){if(1&t){const t=a.Wb();a.Vb(0,"div",10),a.Vb(1,"div",11),a.Vb(2,"mat-select",12),a.dc("ngModelChange",function(e){return a.zc(t),a.hc().selScrollRange=e})("selectionChange",function(e){return a.zc(t),a.hc().onRangeChanged(e)}),a.Ic(3,I,3,4,"mat-option",13),a.Ub(),a.Ub(),a.Vb(4,"div",14),a.Ic(5,A,6,6,"mat-form-field",15),a.Ic(6,M,6,6,"mat-form-field",16),a.Ub(),a.Ub()}if(2&t){const t=a.hc();a.oc("@sliderAnimation",t.animationDirection),a.Db(2),a.oc("ngModel",t.selScrollRange),a.Db(1),a.oc("ngForOf",t.scrollRanges),a.Db(2),a.oc("ngIf",t.selScrollRange===t.scrollRanges[0]),a.Db(1),a.oc("ngIf",t.selScrollRange===t.scrollRanges[1])}}let z=(()=>{class t{constructor(t){this.logger=t,this.scrollRanges=c.p,this.selScrollRange=this.scrollRanges[0],this.today=new Date(Date.now()),this.first=new Date(2018,0,1,0,0,0),this.last=new Date(this.today.getFullYear(),this.today.getMonth(),this.today.getDate(),0,0,0),this.disablePrev=!1,this.disableNext=!0,this.animationDirection="",this.selectedValue=this.last,this.stepChanged=new a.o}ngOnInit(){}onRangeChanged(t){this.selScrollRange=t.value,this.onStepChange("LAST")}onMonthSelected(t){this.selectedValue=t,this.onStepChange("SELECTED"),this.monthlyDatepicker.close()}onYearSelected(t){this.selectedValue=t,this.onStepChange("SELECTED"),this.yearlyDatepicker.close()}onStepChange(t){switch(this.logger.info(t),t){case"FIRST":this.animationDirection="backward",this.selectedValue!==this.first&&(this.selectedValue=this.first,this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange}));break;case"PREVIOUS":this.selectedValue=this.selScrollRange===c.p[1]?new Date(this.selectedValue.getFullYear()-1,0,1,0,0,0):new Date(this.selectedValue.getFullYear(),this.selectedValue.getMonth()-1,1,0,0,0),this.animationDirection="backward",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;case"NEXT":this.selectedValue=this.selScrollRange===c.p[1]?new Date(this.selectedValue.getFullYear()+1,0,1,0,0,0):new Date(this.selectedValue.getFullYear(),this.selectedValue.getMonth()+1,1,0,0,0),this.animationDirection="forward",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;case"LAST":this.animationDirection="forward",this.selectedValue=this.last,this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange});break;default:this.animationDirection="",this.stepChanged.emit({selDate:this.selectedValue,selScrollRange:this.selScrollRange})}this.disablePrev=this.selScrollRange===c.p[1]?this.selectedValue.getFullYear()<=this.first.getFullYear():this.selectedValue.getFullYear()<=this.first.getFullYear()&&this.selectedValue.getMonth()<=this.first.getMonth(),this.disableNext=this.selScrollRange===c.p[1]?this.selectedValue.getFullYear()>=this.last.getFullYear():this.selectedValue.getFullYear()>=this.last.getFullYear()&&this.selectedValue.getMonth()>=this.last.getMonth(),this.logger.info(this.disablePrev),this.logger.info(this.disableNext),setTimeout(()=>{this.animationDirection=""},800)}onChartMouseUp(t){"monthlyDate"===t.srcElement.name?this.monthlyDatepicker.open():"yearlyDate"===t.srcElement.name&&this.yearlyDatepicker.open()}}return t.\u0275fac=function(e){return new(e||t)(a.Pb(o.b))},t.\u0275cmp=a.Jb({type:t,selectors:[["rtl-horizontal-scroller"]],viewQuery:function(t,e){if(1&t&&(a.Pc(C,!0),a.Pc(U,!0)),2&t){let t;a.vc(t=a.ec())&&(e.monthlyDatepicker=t.first),a.vc(t=a.ec())&&(e.yearlyDatepicker=t.first)}},hostBindings:function(t,e){1&t&&a.dc("click",function(t){return e.onChartMouseUp(t)})},outputs:{stepChanged:"stepChanged"},decls:20,vars:5,consts:[["fxLayout","row","fxLayoutAlign","space-between stretch","fxFlex","100",1,"padding-gap-x"],["fxLayout","row","fxLayoutAlign","start center","fxFlex","22"],["mat-icon-button","","color","primary","type","button","tabindex","1",1,"pr-4",3,"click"],["mat-icon-button","","color","primary","type","button","tabindex","2",3,"disabled","click"],[3,"ngTemplateOutlet","ngTemplateOutletContext",4,"ngIf"],["fxLayout","row","fxLayoutAlign","end center","fxFlex","22"],["mat-icon-button","","color","primary","type","button","tabindex","5",1,"pr-4",3,"disabled","click"],["mat-icon-button","","color","primary","type","button","tabindex","6",3,"click"],["controlsPanel",""],[3,"ngTemplateOutlet","ngTemplateOutletContext"],["fxLayout","row","fxLayoutAlign","center center","fxFlex","56"],["fxFlex","50","fxLayoutAlign","center center","fxLayoutAlign.gt-xs","end center",1,"font-bold-700"],["fxFlex","80","fxFlex.gt-md","30","placeholder","Range","tabindex","3",1,"font-bold-700",3,"ngModel","ngModelChange","selectionChange"],[3,"value",4,"ngFor","ngForOf"],["fxFlex","50","fxLayout","row","fxLayoutAlign","center center","fxLayoutAlign.gt-xs","start center"],["monthlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center",4,"ngIf"],["yearlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center",4,"ngIf"],[3,"value"],["monthlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center"],["matInput","","name","monthlyDate","tabindex","4","readonly","",3,"matDatepicker","min","max","ngModel","ngModelChange"],["monthlyDt","ngModel"],["matSuffix","",3,"for"],["startView","year",3,"startAt","monthSelected","dateSelected"],["monthlyDatepicker",""],["yearlyDate","","fxFlex","80","fxFlex.gt-md","30","fxLayoutAlign","center center"],["matInput","","name","yearlyDate","tabindex","4","readonly","",3,"matDatepicker","min","max","ngModel","ngModelChange"],["yearlyDt","ngModel"],["startView","multi-year",3,"startAt","yearSelected","monthSelected","dateSelected"],["yearlyDatepicker",""]],template:function(t,e){1&t&&(a.Vb(0,"div",0),a.Vb(1,"div",1),a.Vb(2,"button",2),a.dc("click",function(){return e.onStepChange("FIRST")}),a.Vb(3,"mat-icon"),a.Kc(4,"skip_previous"),a.Ub(),a.Ub(),a.Vb(5,"button",3),a.dc("click",function(){return e.onStepChange("PREVIOUS")}),a.Vb(6,"mat-icon"),a.Kc(7,"navigate_before"),a.Ub(),a.Ub(),a.Ub(),a.Ic(8,k,1,3,"ng-container",4),a.Ic(9,F,1,3,"ng-container",4),a.Ic(10,T,1,3,"ng-container",4),a.Vb(11,"div",5),a.Vb(12,"button",6),a.dc("click",function(){return e.onStepChange("NEXT")}),a.Vb(13,"mat-icon"),a.Kc(14,"navigate_next"),a.Ub(),a.Ub(),a.Vb(15,"button",7),a.dc("click",function(){return e.onStepChange("LAST")}),a.Vb(16,"mat-icon"),a.Kc(17,"skip_next"),a.Ub(),a.Ub(),a.Ub(),a.Ub(),a.Ic(18,Y,7,5,"ng-template",null,8,a.Jc)),2&t&&(a.Db(5),a.oc("disabled",e.disablePrev),a.Db(3),a.oc("ngIf","forward"===e.animationDirection),a.Db(1),a.oc("ngIf","backward"===e.animationDirection),a.Db(1),a.oc("ngIf",""===e.animationDirection),a.Db(2),a.oc("disabled",e.disableNext))},directives:[s.c,s.b,s.a,r.a,l.a,u.o,u.t,d.a,b.m,b.p,u.n,m.m,f.c,x,V.b,D.b,v.a,w.a,b.c,D.d,f.g,D.a,S],pipes:[u.x],styles:[""],data:{animation:[i.a]}}),t})()},Ysfc:function(t,e,n){"use strict";n.d(e,"a",function(){return v});var a=n("iELJ"),i=n("wHSu"),c=n("7nzP"),o=n("8Y7J"),s=n("cpEJ"),r=n("7o2P"),l=n("zHaW"),u=n("VDRc"),d=n("SVse"),b=n("ura0"),m=n("bwdU"),f=n("PDjf"),h=n("Nv++"),g=n("Dxy4"),p=n("BSbQ"),y=n("O4ig"),x=n("dEYt");function S(t,e){if(1&t&&(o.Vb(0,"div",13),o.Vb(1,"div",14),o.Vb(2,"h4",15),o.Kc(3,"Address Type"),o.Ub(),o.Vb(4,"span",20),o.Kc(5),o.Ub(),o.Ub(),o.Ub()),2&t){const t=o.hc();o.Db(5),o.Lc(t.addressType)}}function V(t,e){1&t&&o.Qb(0,"mat-divider",17)}const D=function(t){return{"display-none":t}};let v=(()=>{class t{constructor(t,e,n,a,o){this.dialogRef=t,this.data=e,this.logger=n,this.commonService=a,this.snackBar=o,this.faReceipt=i.D,this.address="",this.addressType="",this.qrWidth=230,this.screenSize="",this.screenSizeEnum=c.q}ngOnInit(){this.address=this.data.address,this.addressType=this.data.addressType,this.screenSize=this.commonService.getScreenSize()}onClose(){this.dialogRef.close(!1)}onCopyAddress(t){this.snackBar.open("Generated address copied."),this.logger.info("Copied Text: "+t)}}return t.\u0275fac=function(e){return new(e||t)(o.Pb(a.f),o.Pb(a.a),o.Pb(s.b),o.Pb(r.a),o.Pb(l.b))},t.\u0275cmp=o.Jb({type:t,selectors:[["rtl-on-chain-generated-address"]],decls:27,vars:22,consts:[["fxLayout","column","fxLayout.gt-sm","row","fxLayoutAlign","space-between stretch"],["fxFlex","35","fxLayoutAlign","center start",1,"modal-qr-code-container","padding-gap-large",3,"ngClass"],[3,"qrdata","margin","width","errorCorrectionLevel","allowEmptyString"],["fxFlex","65",1,"padding-gap-large"],["fxLayout","row","fxLayoutAlign","space-between center",1,"modal-info-header","mb-2"],["fxFlex","95","fxLayoutAlign","start start"],[1,"page-title-img","mr-1",3,"icon"],[1,"page-title"],["tabindex","2","fxFlex","5","fxLayoutAlign","center","mat-button","",1,"btn-close-x","p-0",3,"click"],["fxLayout","column"],["fxFlex","50","fxLayoutAlign","center start",1,"modal-qr-code-container","padding-gap-large",3,"ngClass"],["fxLayout","row",4,"ngIf"],["class","w-100 my-1",4,"ngIf"],["fxLayout","row"],["fxFlex","100"],["fxLayoutAlign","start",1,"font-bold-500"],[1,"overflow-wrap","foreground-secondary-text"],[1,"w-100","my-1"],["fxLayout","row","fxLayoutAlign","end center",1,"mt-2"],["autoFocus","","mat-flat-button","","color","primary","tabindex","1","type","submit","rtlClipboard","",3,"payload","copied"],[1,"foreground-secondary-text"]],template:function(t,e){1&t&&(o.Vb(0,"div",0),o.Vb(1,"div",1),o.Qb(2,"qrcode",2),o.Ub(),o.Vb(3,"div",3),o.Vb(4,"mat-card-header",4),o.Vb(5,"div",5),o.Qb(6,"fa-icon",6),o.Vb(7,"span",7),o.Kc(8),o.Ub(),o.Ub(),o.Vb(9,"button",8),o.dc("click",function(){return e.onClose()}),o.Kc(10,"X"),o.Ub(),o.Ub(),o.Vb(11,"mat-card-content"),o.Vb(12,"div",9),o.Vb(13,"div",10),o.Qb(14,"qrcode",2),o.Ub(),o.Ic(15,S,6,1,"div",11),o.Ic(16,V,1,0,"mat-divider",12),o.Vb(17,"div",13),o.Vb(18,"div",14),o.Vb(19,"h4",15),o.Kc(20,"Address"),o.Ub(),o.Vb(21,"span",16),o.Kc(22),o.Ub(),o.Ub(),o.Ub(),o.Qb(23,"mat-divider",17),o.Vb(24,"div",18),o.Vb(25,"button",19),o.dc("copied",function(t){return e.onCopyAddress(t)}),o.Kc(26,"Copy Address"),o.Ub(),o.Ub(),o.Ub(),o.Ub(),o.Ub(),o.Ub()),2&t&&(o.Db(1),o.oc("ngClass",o.sc(18,D,e.screenSize===e.screenSizeEnum.XS||e.screenSize===e.screenSizeEnum.SM)),o.Db(1),o.oc("qrdata",e.address)("margin",2)("width",e.qrWidth)("errorCorrectionLevel","L")("allowEmptyString",!0),o.Db(4),o.oc("icon",e.faReceipt),o.Db(2),o.Lc(e.screenSize===e.screenSizeEnum.XS?"Address":"Generated Address"),o.Db(5),o.oc("ngClass",o.sc(20,D,e.screenSize!==e.screenSizeEnum.XS&&e.screenSize!==e.screenSizeEnum.SM)),o.Db(1),o.oc("qrdata",e.address)("margin",2)("width",e.qrWidth)("errorCorrectionLevel","L")("allowEmptyString",!0),o.Db(1),o.oc("ngIf",""!==e.addressType),o.Db(1),o.oc("ngIf",""!==e.addressType),o.Db(6),o.Lc(e.address),o.Db(3),o.oc("payload",e.address))},directives:[u.c,u.b,u.a,d.m,b.a,m.a,f.c,h.a,g.a,f.b,d.o,p.a,y.a,x.a],styles:[""]}),t})()},d4ms:function(t,e,n){"use strict";n.d(e,"a",function(){return P});var a=n("5QHs"),i=n("LUZP"),c=n("OaSA"),o=n("7nzP"),s=n("/uX3"),r=n("8Y7J"),l=n("7o2P"),u=n("tqRt"),d=n("SVse"),b=n("VDRc"),m=n("Q2Ze"),f=n("e6WT"),h=n("s7LF"),g=n("aLe/"),p=n("ZTz/"),y=n("UhP/"),x=n("Dxy4"),S=n("ura0");function V(t,e){1&t&&(r.Vb(0,"th",27),r.Kc(1,"Date"),r.Ub())}function D(t,e){if(1&t&&(r.Vb(0,"td",28),r.Kc(1),r.ic(2,"uppercase"),r.ic(3,"date"),r.Ub()),2&t){const t=e.$implicit,n=r.hc();r.Db(1),r.Lc(r.jc(2,1,r.kc(3,3,null==t?null:t.date,n.dataRange===n.scrollRanges[1]?"MMM/yyyy":"dd/MMM/yyyy")))}}function v(t,e){1&t&&(r.Vb(0,"th",29),r.Kc(1,"Amount Paid (Sats)"),r.Ub())}function w(t,e){if(1&t&&(r.Vb(0,"td",28),r.Vb(1,"span",30),r.Kc(2),r.ic(3,"number"),r.Ub(),r.Ub()),2&t){const t=e.$implicit;r.Db(2),r.Lc(r.kc(3,1,null==t?null:t.amount_paid,"1.0-0"))}}function C(t,e){1&t&&(r.Vb(0,"th",29),r.Kc(1,"# Payments"),r.Ub())}function U(t,e){if(1&t&&(r.Vb(0,"td",28),r.Vb(1,"span",30),r.Kc(2),r.ic(3,"number"),r.Ub(),r.Ub()),2&t){const t=e.$implicit;r.Db(2),r.Lc(r.jc(3,1,null==t?null:t.num_payments))}}function L(t,e){1&t&&(r.Vb(0,"th",29),r.Kc(1,"Amount Received (Sats)"),r.Ub())}function k(t,e){if(1&t&&(r.Vb(0,"td",28),r.Vb(1,"span",30),r.Kc(2),r.ic(3,"number"),r.Ub(),r.Ub()),2&t){const t=e.$implicit;r.Db(2),r.Lc(r.kc(3,1,null==t?null:t.amount_received,"1.0-0"))}}function O(t,e){1&t&&(r.Vb(0,"th",29),r.Kc(1,"# Invoices"),r.Ub())}function F(t,e){if(1&t&&(r.Vb(0,"td",28),r.Vb(1,"span",30),r.Kc(2),r.ic(3,"number"),r.Ub(),r.Ub()),2&t){const t=e.$implicit;r.Db(2),r.Lc(r.jc(3,1,null==t?null:t.num_invoices))}}function R(t,e){if(1&t){const t=r.Wb();r.Vb(0,"th",31),r.Vb(1,"div",32),r.Vb(2,"mat-select",33),r.Qb(3,"mat-select-trigger"),r.Vb(4,"mat-option",34),r.dc("click",function(){return r.zc(t),r.hc().onDownloadCSV()}),r.Kc(5,"Download CSV"),r.Ub(),r.Ub(),r.Ub(),r.Ub()}}function T(t,e){if(1&t){const t=r.Wb();r.Vb(0,"td",35),r.Vb(1,"button",36),r.dc("click",function(){r.zc(t);const n=e.$implicit;return r.hc().onTransactionClick(n)}),r.Kc(2,"View Info"),r.Ub(),r.Ub()}}function I(t,e){1&t&&(r.Vb(0,"p"),r.Kc(1,"No transactions available."),r.Ub())}function A(t,e){if(1&t&&(r.Vb(0,"td",37),r.Ic(1,I,2,0,"p",38),r.Ub()),2&t){const t=r.hc();r.Db(1),r.oc("ngIf",!(null!=t.transactions&&t.transactions.data)||(null==t.transactions||null==t.transactions.data?null:t.transactions.data.length)<1)}}const M=function(t){return{"display-none":t}};function Y(t,e){if(1&t&&r.Qb(0,"tr",39),2&t){const t=r.hc();r.oc("ngClass",r.sc(1,M,(null==t.transactions?null:t.transactions.data)&&(null==t.transactions||null==t.transactions.data?null:t.transactions.data.length)>0))}}function z(t,e){1&t&&r.Qb(0,"tr",40)}function j(t,e){1&t&&r.Qb(0,"tr",41)}const E=function(){return["no_transaction"]};let P=(()=>{class t{constructor(t,e,n){this.commonService=t,this.store=e,this.datePipe=n,this.dataRange=o.p[0],this.dataList=[],this.filterValue="",this.scrollRanges=o.p,this.displayedColumns=[],this.flgSticky=!1,this.pageSize=o.n,this.pageSizeOptions=o.o,this.screenSize="",this.screenSizeEnum=o.q,this.screenSize=this.commonService.getScreenSize(),this.screenSize===o.q.XS||this.screenSize===o.q.SM?(this.flgSticky=!1,this.displayedColumns=["date","amount_paid","amount_received","actions"]):this.screenSize===o.q.MD?(this.flgSticky=!1,this.displayedColumns=["date","amount_paid","num_payments","amount_received","num_invoices","actions"]):(this.flgSticky=!0,this.displayedColumns=["date","amount_paid","num_payments","amount_received","num_invoices","actions"])}ngAfterViewInit(){this.dataList&&this.dataList.length>0&&this.loadTransactionsTable(this.dataList)}ngOnChanges(t){t.dataList&&this.loadTransactionsTable(this.dataList),t.filterValue&&this.applyFilter()}onTransactionClick(t){const e=[[{key:"date",value:this.datePipe.transform(t.date,this.dataRange===o.p[1]?"MMM/yyyy":"dd/MMM/yyyy"),title:"Date",width:100,type:o.h.DATE}],[{key:"amount_paid",value:Math.round(t.amount_paid),title:"Amount Paid (Sats)",width:50,type:o.h.NUMBER},{key:"num_payments",value:t.num_payments,title:"# Payments",width:50,type:o.h.NUMBER}],[{key:"amount_received",value:Math.round(t.amount_received),title:"Amount Received (Sats)",width:50,type:o.h.NUMBER},{key:"num_invoices",value:t.num_invoices,title:"# Invoices",width:50,type:o.h.NUMBER}]];this.store.dispatch(new s.C({data:{type:o.b.INFORMATION,alertTitle:"Transaction Summary",message:e}}))}applyFilter(){this.transactions&&(this.transactions.filter=this.filterValue)}loadTransactionsTable(t){this.transactions=new c.o(t?[]:[...t]),this.transactions.data=t,this.transactions.sortingDataAccessor=(t,e)=>t[e]&&isNaN(t[e])?t[e].toLocaleLowerCase():t[e]?+t[e]:null,this.transactions.sort=this.sort,this.transactions.paginator=this.paginator}onDownloadCSV(){this.transactions.data&&this.transactions.data.length>0&&this.commonService.downloadFile(this.dataList,"Transactions-report-"+this.dataRange.toLowerCase())}}return t.\u0275fac=function(e){return new(e||t)(r.Pb(l.a),r.Pb(u.h),r.Pb(d.e))},t.\u0275cmp=r.Jb({type:t,selectors:[["rtl-transactions-report-table"]],viewQuery:function(t,e){if(1&t&&(r.Pc(i.a,!0),r.Pc(a.a,!0)),2&t){let t;r.vc(t=r.ec())&&(e.sort=t.first),r.vc(t=r.ec())&&(e.paginator=t.first)}},inputs:{dataRange:"dataRange",dataList:"dataList",filterValue:"filterValue"},features:[r.Cb([{provide:a.b,useValue:Object(o.y)("Transactions")}]),r.Bb],decls:34,vars:10,consts:[["fxLayout","column","fxFlex","100","fxLayoutAlign","space-between stretch",1,"padding-gap-x"],["fxLayout","column","fxLayoutAlign","start stretch"],["fxLayout","column","fxLayoutAlign","start stretch","fxLayout.gt-sm","row wrap",1,"page-sub-title-container","mt-1"],["fxFlex","70"],["fxFlex","30","fxLayoutAlign","start end"],["matInput","","placeholder","Filter",3,"ngModel","ngModelChange","input","keyup"],["fxLayout","row","fxLayoutAlign","start start"],["perfectScrollbar","","fxLayout","column","fxFlex","100",1,"table-container"],["mat-table","","fxFlex","100","matSort","",1,"overflow-auto",3,"dataSource"],["table",""],["matColumnDef","date"],["mat-header-cell","","mat-sort-header","",4,"matHeaderCellDef"],["mat-cell","",4,"matCellDef"],["matColumnDef","amount_paid"],["mat-header-cell","","mat-sort-header","","arrowPosition","before",4,"matHeaderCellDef"],["matColumnDef","num_payments"],["matColumnDef","amount_received"],["matColumnDef","num_invoices"],["matColumnDef","actions"],["mat-header-cell","","class","px-3",4,"matHeaderCellDef"],["mat-cell","","class","px-3","fxLayoutAlign","end center",4,"matCellDef"],["matColumnDef","no_transaction"],["mat-footer-cell","","colspan","4",4,"matFooterCellDef"],["mat-footer-row","",3,"ngClass",4,"matFooterRowDef"],["mat-header-row","",4,"matHeaderRowDef","matHeaderRowDefSticky"],["mat-row","",4,"matRowDef","matRowDefColumns"],[1,"mb-4",3,"pageSize","pageSizeOptions","showFirstLastButtons"],["mat-header-cell","","mat-sort-header",""],["mat-cell",""],["mat-header-cell","","mat-sort-header","","arrowPosition","before"],["fxLayoutAlign","end center"],["mat-header-cell","",1,"px-3"],[1,"bordered-box","table-actions-select"],["placeholder","Actions","tabindex","1",1,"mr-0"],[3,"click"],["mat-cell","","fxLayoutAlign","end center",1,"px-3"],["mat-stroked-button","","color","primary","type","button","tabindex","4",3,"click"],["mat-footer-cell","","colspan","4"],[4,"ngIf"],["mat-footer-row","",3,"ngClass"],["mat-header-row",""],["mat-row",""]],template:function(t,e){1&t&&(r.Vb(0,"div",0),r.Vb(1,"div",1),r.Vb(2,"div",2),r.Qb(3,"div",3),r.Vb(4,"mat-form-field",4),r.Vb(5,"input",5),r.dc("ngModelChange",function(t){return e.filterValue=t})("input",function(){return e.applyFilter()})("keyup",function(){return e.applyFilter()}),r.Ub(),r.Ub(),r.Ub(),r.Vb(6,"div",6),r.Vb(7,"div",7),r.Vb(8,"table",8,9),r.Tb(10,10),r.Ic(11,V,2,0,"th",11),r.Ic(12,D,4,6,"td",12),r.Sb(),r.Tb(13,13),r.Ic(14,v,2,0,"th",14),r.Ic(15,w,4,4,"td",12),r.Sb(),r.Tb(16,15),r.Ic(17,C,2,0,"th",14),r.Ic(18,U,4,3,"td",12),r.Sb(),r.Tb(19,16),r.Ic(20,L,2,0,"th",14),r.Ic(21,k,4,4,"td",12),r.Sb(),r.Tb(22,17),r.Ic(23,O,2,0,"th",14),r.Ic(24,F,4,3,"td",12),r.Sb(),r.Tb(25,18),r.Ic(26,R,6,0,"th",19),r.Ic(27,T,3,0,"td",20),r.Sb(),r.Tb(28,21),r.Ic(29,A,2,1,"td",22),r.Sb(),r.Ic(30,Y,1,3,"tr",23),r.Ic(31,z,1,0,"tr",24),r.Ic(32,j,1,0,"tr",25),r.Ub(),r.Qb(33,"mat-paginator",26),r.Ub(),r.Ub(),r.Ub(),r.Ub()),2&t&&(r.Db(5),r.oc("ngModel",e.filterValue),r.Db(3),r.oc("dataSource",e.transactions),r.Db(22),r.oc("matFooterRowDef",r.rc(9,E)),r.Db(1),r.oc("matHeaderRowDef",e.displayedColumns)("matHeaderRowDefSticky",e.flgSticky),r.Db(1),r.oc("matRowDefColumns",e.displayedColumns),r.Db(1),r.oc("pageSize",e.pageSize)("pageSizeOptions",e.pageSizeOptions)("showFirstLastButtons",e.screenSize!==e.screenSizeEnum.XS))},directives:[b.c,b.a,b.b,m.c,f.b,h.c,h.m,h.p,g.b,c.n,i.a,c.c,c.i,c.b,c.e,c.g,c.k,c.m,a.a,c.h,i.b,c.a,p.a,p.c,y.m,x.a,c.d,d.o,c.f,d.m,S.a,c.j,c.l],pipes:[d.y,d.e,d.f],styles:[".mat-column-actions[_ngcontent-%COMP%]{min-height:4.8rem}"]}),t})()},hNFU:function(t,e,n){"use strict";n.d(e,"a",function(){return c});var a=n("s7LF"),i=n("8Y7J");let c=(()=>{class t{validate(t){return this.max?a.t.max(+this.max)(t):null}}return t.\u0275fac=function(e){return new(e||t)},t.\u0275dir=i.Kb({type:t,selectors:[["input","max",""]],inputs:{max:"max"},features:[i.Cb([{provide:a.j,useExisting:t,multi:!0}])]}),t})()},mNcL:function(t,e,n){"use strict";n.d(e,"a",function(){return i});var a=n("GS7A");const i=[Object(a.m)("newlyAddedRowAnimation",[Object(a.j)("notAdded, void",Object(a.k)({transform:"translateX(0%)"})),Object(a.j)("added",Object(a.k)({transform:"translateX(100%)"})),Object(a.l)("added <=> notAdded",Object(a.e)("1000ms ease-out")),Object(a.l)("added <=> void",Object(a.e)("0ms ease-out"))])]},qmev:function(t,e,n){"use strict";n.d(e,"a",function(){return x});var a=n("XNiG"),i=n("SxV6"),c=n("1G5W"),o=n("7nzP"),s=n("8Y7J"),r=n("7o2P"),l=n("tqRt"),u=n("M9ds"),d=n("SVse"),b=n("VDRc"),m=n("ZFy/");function f(t,e){if(1&t&&(s.Vb(0,"span",7),s.Kc(1),s.ic(2,"number"),s.Ub()),2&t){const t=s.hc().$implicit;s.Db(1),s.Lc(s.jc(2,1,t.dataValue))}}function h(t,e){if(1&t&&(s.Vb(0,"span",7),s.Kc(1),s.ic(2,"number"),s.Ub()),2&t){const t=s.hc().$implicit,e=s.hc(2);s.Db(1),s.Lc(s.kc(2,1,t[e.currencyUnitEnum.BTC],e.currencyUnitFormats.BTC))}}function g(t,e){if(1&t&&(s.Vb(0,"span",7),s.Kc(1),s.ic(2,"number"),s.Ub()),2&t){const t=s.hc().$implicit,e=s.hc(2);s.Db(1),s.Lc(s.kc(2,1,t[e.currencyUnitEnum.OTHER],e.currencyUnitFormats.OTHER))}}function p(t,e){if(1&t&&(s.Vb(0,"div",4),s.Vb(1,"div",5),s.Kc(2),s.Ub(),s.Ic(3,f,3,3,"span",6),s.Ic(4,h,3,4,"span",6),s.Ic(5,g,3,4,"span",6),s.Ub()),2&t){const t=e.$implicit,n=s.hc().$implicit,a=s.hc();s.oc("matTooltip",t.tooltip)("matTooltipPosition","below"),s.Db(2),s.Lc(t.title),s.Db(1),s.oc("ngIf",n===a.currencyUnitEnum.SATS),s.Db(1),s.oc("ngIf",n===a.currencyUnitEnum.BTC),s.Db(1),s.oc("ngIf",a.fiatConversion&&n!==a.currencyUnitEnum.SATS&&n!==a.currencyUnitEnum.BTC)}}function y(t,e){if(1&t&&(s.Vb(0,"mat-tab",1),s.Vb(1,"div",2),s.Ic(2,p,6,6,"div",3),s.Ub(),s.Ub()),2&t){const t=e.$implicit,n=s.hc();s.pc("label",t),s.Db(2),s.oc("ngForOf",n.values)}}let x=(()=>{class t{constructor(t,e){this.commonService=t,this.store=e,this.values=[],this.currencyUnitEnum=o.g,this.currencyUnitFormats=o.f,this.currencyUnits=[],this.fiatConversion=!1,this.unSubs=[new a.a,new a.a]}ngOnInit(){this.store.select("root").pipe(Object(i.a)()).subscribe(t=>{this.fiatConversion=t.selNode.settings.fiatConversion,this.currencyUnits=t.selNode.settings.currencyUnits,this.fiatConversion||this.currencyUnits.splice(2,1),this.currencyUnits.length>1&&this.values[0].dataValue>=0&&this.getCurrencyValues(this.values)})}ngOnChanges(){this.currencyUnits.length>1&&this.values[0].dataValue>=0&&this.getCurrencyValues(this.values)}getCurrencyValues(t){t.forEach(t=>{t.dataValue>0?this.commonService.convertCurrency(t.dataValue,o.g.SATS,this.currencyUnits[2],this.fiatConversion).pipe(Object(c.a)(this.unSubs[1])).subscribe(e=>{t[o.g.BTC]=e.BTC,t[o.g.OTHER]=e.OTHER}):(t[o.g.BTC]=t.dataValue,t[o.g.OTHER]=t.dataValue)})}ngOnDestroy(){this.unSubs.forEach(t=>{t.next(),t.complete()})}}return t.\u0275fac=function(e){return new(e||t)(s.Pb(r.a),s.Pb(l.h))},t.\u0275cmp=s.Jb({type:t,selectors:[["rtl-currency-unit-converter"]],inputs:{values:"values"},features:[s.Bb],decls:2,vars:1,consts:[[3,"label",4,"ngFor","ngForOf"],[3,"label"],["fxLayout","row","fxFlex","100"],["fxLayout","column","class","cc-data-block",3,"matTooltip","matTooltipPosition",4,"ngFor","ngForOf"],["fxLayout","column",1,"cc-data-block",3,"matTooltip","matTooltipPosition"],[1,"cc-data-title"],["class","cc-data-value",4,"ngIf"],[1,"cc-data-value"]],template:function(t,e){1&t&&(s.Vb(0,"mat-tab-group"),s.Ic(1,y,3,2,"mat-tab",0),s.Ub()),2&t&&(s.Db(1),s.oc("ngForOf",e.currencyUnits))},directives:[u.b,d.n,u.a,b.c,b.a,m.a,d.o],pipes:[d.f],styles:[""]}),t})()},"twK/":function(t,e,n){"use strict";n.d(e,"a",function(){return a}),n.d(e,"b",function(){return i});var a={prefix:"far",iconName:"frown",icon:[496,512,[],"f119","M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160-64c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm-80 128c-40.2 0-78 17.7-103.8 48.6-8.5 10.2-7.1 25.3 3.1 33.8 10.2 8.4 25.3 7.1 33.8-3.1 16.6-19.9 41-31.4 66.9-31.4s50.3 11.4 66.9 31.4c8.1 9.7 23.1 11.9 33.8 3.1 10.2-8.5 11.5-23.6 3.1-33.8C326 321.7 288.2 304 248 304z"]},i={prefix:"far",iconName:"smile",icon:[496,512,[],"f118","M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 448c-110.3 0-200-89.7-200-200S137.7 56 248 56s200 89.7 200 200-89.7 200-200 200zm-80-216c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm160 0c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm4 72.6c-20.8 25-51.5 39.4-84 39.4s-63.2-14.3-84-39.4c-8.5-10.2-23.7-11.5-33.8-3.1-10.2 8.5-11.5 23.6-3.1 33.8 30 36 74.1 56.6 120.9 56.6s90.9-20.6 120.9-56.6c8.5-10.2 7.1-25.3-3.1-33.8-10.1-8.4-25.3-7.1-33.8 3.1z"]}}}]);