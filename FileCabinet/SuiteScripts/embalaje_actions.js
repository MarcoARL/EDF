/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord','N/url'], function(currentRecord, url) {

    function buscar_info(context){
       
        var records = currentRecord.get();
      
        var id = records.getValue('id');

        var scriptUrl = url.resolveScript({
            scriptId:'customscript_csc_embalaje_suitelet',
            deploymentId:'customdeploy_csc_embalaje_suitelet',
            params:{
                value: id
            }
        });
        
        if(id){

            window.open(scriptUrl, '_blank');
        }
        
       
    }

    function pageInit(context) {
        
    }


    return {
        buscar_info:buscar_info,
        pageInit: pageInit,

    }
});
