/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/ui/serverWidget','N/record'], function(serverWidget,record) {

    function beforeLoad(context) {

        context.form.clientScriptModulePath = './embalaje_actions.js';


        var id = context.newRecord.id;
        log.audit({title:'newRecord',details: id});


        if(id){
            var transaccion = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: id,
                isDynamic: true
            })
            var orden = transaccion.getText('createdfrom');
            var tipo = orden.split('#');
            log.audit({title: 'tipo', details:tipo[0]});
        
       


        if(tipo[0]=='Transfer Order ' || tipo[0]=='Orden de traslado '){

        
        var button = context.form.addButton({
            id : 'custpage_createreport',
            label : 'Remporte de embalaje',
            functionName: 'buscar_info'
        });
   }

        }
    }



    return {
        beforeLoad: beforeLoad,

    }
});
