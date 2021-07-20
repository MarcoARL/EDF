/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(["N/record", "N/log", "N/render"],
    function (record, log, render) {

        var glbCurRecord = null;

        function beforeLoad(context) {
            try {

                if (context.type == context.UserEventType.VIEW) {
                    glbCurRecord = context.newRecord;

                    var form = context.form;

                    var recId = glbCurRecord.getValue({
                        fieldId: 'id'
                    });
                    //
                    // var folio = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var fecha = glbCurRecord.getValue({
                    //     fieldId: 'trandate'
                    // });
                    //
                    // var empresaRecibe = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var direccion = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var depositante = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var banco = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var cuenta = glbCurRecord.getValue({
                    //     fieldId: 'account'
                    // });
                    //
                    // var concepto = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var monto = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var letra = glbCurRecord.getValue({
                    //     fieldId: 'id'
                    // });
                    //
                    // var pdfData = {
                    //     folio: x folio,
                    //     fecha: fecha,
                    //     empresaRecibe: empresaRecibe,
                    //     direccion: direccion,
                    //     depositante: depositante,
                    //     banco: banco,
                    //     cuenta: cuenta,
                    //     concepto: concepto,
                    //     monto: monto,
                    //     letra: letra
                    // };


                    form.addButton({
                        id: 'custpage_btn_imprimir',
                        label: 'Imprimir',
                        functionName: 'imprimir(' + recId + ')'
                    });

                    form.clientScriptModulePath = "./Bank_Deposit_Print_Template_CS.js";
                }

            } catch (e) {
                log.error({
                    title: 'beforeLoad - error',
                    details: e.toString()
                })
            }

        }

        function beforeSubmit(context) {

        }

        function afterSubmit(context) {

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    });
