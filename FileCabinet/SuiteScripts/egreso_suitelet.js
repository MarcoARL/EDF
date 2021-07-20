/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/record','N/search','N/render','N/file','N/format/i18n'], function(record,search,render,file,format) {

    function onRequest(context) {
        var id = JSON.parse(context.request.parameters.value);
        var response = context.response;
        log.audit({title:'url:',details:id});
//obtener datos del cheque
        var records = record.load({
            type: record.Type.CHECK, 
            id: id,
            isDynamic: true,
        });
        

        var subsidiaria = records.getValue('subsidiary');
        var subsidiaria_texto = records.getText('subsidiary');
        var entity = records.getValue('entity');
        var entity_text = records.getText('entity');
        var account = records.getValue('account');
        var account_text = records.getText('account');
        var total = records.getValue('usertotal');
        var notas = records.getValue('memo');
        var fecha_emision = new Date();
        fecha_emision = records.getValue('trandate') || '';
        if(fecha_emision){
            var date_emision = fecha_emision.getDate() +'/' + fecha_emision.getMonth()+'/'+fecha_emision.getFullYear();
        }else{
            var date_emision = fecha_emision;
        }

        //convertir total a letras
    
        var montocut = JSON.stringify(total);
        var monto = montocut.split(".");
        if(!monto[1]){
            monto[1]='00';
        }
        var moneda = records.getValue('currency');
        var moneda_texto = records.getText('currency');
        var spellOut = format.spellOut({
            number: total, 
            locale: "ES"
        });
        var texto = spellOut.split(" coma");
        var traduccion = texto[0].toUpperCase()+' '+monto[1]+"/100 "+moneda_texto;
        log.audit({title:'letra:',details:traduccion});

        //


        var cuenta_bancaria_carga = record.load({
            type: record.Type.ACCOUNT,
            id: account,
            isDynamic: true
        });


        var cuenta_bancaria = cuenta_bancaria_carga.getValue('custrecord_csc_cuenta_clabe');
        var nombre_banco = cuenta_bancaria_carga.getValue('custrecord_efx_fe_banco');
        var nombre_banco_text = cuenta_bancaria_carga.getText('custrecord_efx_fe_banco');

        var beneficiario = search.create({
            type: search.Type.ENTITY,
            filters: [['internalid',search.Operator.IS,entity]],
            columns:[
                search.createColumn({name: 'type'}),
            ]
        });
        var ejecutar = beneficiario.run();
        var resultado = ejecutar.getRange(0,100); 
        var tipo = resultado[0].getValue({name:'type'});
        log.audit({title:'entity: ',details: tipo}); 
        var tipo_search = '';
        var cuenta_entidad = [];
        var banco_entidad = [];
        var nombre_entidad = [];
        var numero_direccion_vendor = [];
        var numero_name_vendor = [];
        
        if(tipo=='Employee' || tipo=='CustJob'){

            if(tipo=='CustJob'){
                
                tipo_search=record.Type.CUSTOMER;
            }

            if(tipo=='Employee'){
                
                tipo_search=record.Type.EMPLOYEE;
            }

            var cuenta_entity = record.load({
                type: tipo_search,
                id: entity,
                isDynamic: true
            });

            numero_direccion_vendor[0] = cuenta_entity.getValue('defaultaddress');
            cuenta_entidad[0] = cuenta_entity.getValue('custentity_effx_cuenta_bancaria_1');
            banco_entidad[0] = cuenta_entity.getText('custentity_effx_bancos');
            try{
                var first = cuenta_entity.getValue('firstname') || '';
                var second = cuenta_entity.getValue('lastname') || '';

                nombre_entidad[0] = first+' '+second;
            }catch(e){
                nombre_entidad[0] = cuenta_entity.getValue('companyname');
            }

        }

        if(tipo=='Vendor'){
            var bank_info = search.create({
                type: 'customrecord_psg_mx_bank_info',
                filters:[['custrecord_psg_mx_bank_info_entity',search.Operator.IS,entity]],
                columns:[
                    search.createColumn({name: 'name'}),
                    search.createColumn({name: 'custrecord_psg_mx_acct_num'}),
                    search.createColumn({name: 'custrecord_psg_mx_bank_name'}),
                ]
            });

            var cuenta_entity = record.load({
                type: record.Type.VENDOR,
                id: entity,
                isDynamic: true
            });



            var ejecutar_bank = bank_info.run();
            var resultado_bank = ejecutar_bank.getRange(0,100);
            var numero_cuenta_vendor = [];
            var nombre_banco_vendor = [];
            var first_n = cuenta_entity.getValue('firstname');
            var second_n = cuenta_entity.getValue('lastname');


            numero_direccion_vendor[0]=cuenta_entity.getValue('defaultaddress');
            nombre_entidad[0]=first_n+' '+second_n;
            log.audit({title: 'entidad', details: numero_direccion_vendor[0]});

            for(var i=0;i<resultado_bank.length;i++){
                numero_cuenta_vendor[i]=resultado_bank[i].getValue({name: 'custrecord_psg_mx_acct_num'});
                nombre_banco_vendor[i]=resultado_bank[i].getValue({name: 'custrecord_psg_mx_bank_name'});

            }
            cuenta_entidad[0] = numero_cuenta_vendor[0];
            banco_entidad[0] = nombre_banco_vendor[0];

            
        }



        log.audit({title:'cuenta',details:cuenta_entidad});




        var subsidiary_record = record.load({
            type: record.Type.SUBSIDIARY, 
            id: subsidiaria,
            isDynamic: true,
        });
        var subsidiary_address = subsidiary_record.getValue('mainaddress_text');
        var subsidiary_logo_url = subsidiary_record.getValue('logo');
        if(subsidiary_logo_url){
            var file_logo = file.load({id: subsidiary_logo_url});
            var subsidiary_logo = file_logo.url;
          }else{
            var subsidiary_logo = '';
          }


        var datosJson = new Object();
        datosJson.id = id;
        datosJson.subsidiaria = subsidiaria_texto;
        datosJson.subsidiaria_address = subsidiary_address;
        datosJson.nombre_banco = nombre_banco_text;
        datosJson.numero_cuenta = cuenta_bancaria;
        datosJson.entity = nombre_entidad[0];
        datosJson.entity_cuenta = cuenta_entidad[0];
        datosJson.entity_banco = banco_entidad[0];
        datosJson.entity_direccion = numero_direccion_vendor[0];

        datosJson.notas = notas;
        datosJson.logo = subsidiary_logo;
        datosJson.fecha = date_emision;
        if(monto[1]=='00'){
            total = total+'.00';
            
        }
        datosJson.importe = '$'+total;
        
        datosJson.monto_letra = traduccion;
        datosJson.items = [];
        datosJson.expenses = [];

        var objItem = {};
        var count_item = records.getLineCount({
            sublistId: 'item'
        });
        var count_expense = records.getLineCount({
            sublistId: 'expense'
        });

        if(count_expense>0){
            for(var x =0;x<count_expense;x++){
                objItem = {};
                objItem.expense = records.getSublistValue({
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: x
                });
                objItem.expense = records.getSublistText({
                    sublistId: 'expense',
                    fieldId: 'account',
                    line: x
                });
                datosJson.expenses.push(objItem);
            }
        }

        if(count_item>0){
            
            for(var x =0;x<count_item;x++){
                objItem = {};
                objItem.items = records.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: x
                });
                datosJson.items.push(objItem);
            }
        }





log.audit({title:'datos', details:datosJson});
//render
        var render_pdf = render.create();
        
        render_pdf.setTemplateById(148);
        var transactionFile = null;

        render_pdf.addCustomDataSource({ format: render.DataSource.OBJECT, alias: "RECORD_PDF", data: datosJson });

        try {

            transactionFile = render_pdf.renderAsPdf();
            response.writeFile({
                file: transactionFile,
                isInline: true
            });
        }
        catch (e) {
            log.error("ERROR", e);
            response.write("INFO: Ha ocurrido un error al intentar crear la plantilla");
            return;
        }


    }

    return {
        onRequest: onRequest
    }
});
