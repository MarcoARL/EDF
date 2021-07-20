/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/ui/serverWidget','N/record'], function(serverWidget,record) {

    function beforeLoad(context) {

        context.form.clientScriptModulePath = './egreso_actions.js';

        
        

       /* var transaccion = record.load({
            type: record.Type.CHECK,
            id: context.request.parameters.id,
            isDynamic: true
        })
        var forma = transaccion.getValue('customform');

        if(forma=='121'){*/

        
        var button = context.form.addButton({
            id : 'custpage_createreport',
            label : 'Reporte de Egreso',
            functionName: 'buscar_info'
        });
 //}
    }



    return {
        beforeLoad: beforeLoad,

    }
});
