$(document).ready(function() {
    $('#date').datepicker({
      dateFormat: 'dd/mm/yy',
      startDate: '01/01/2010',
      endDate: '31/12/2022',
      todayBtn: 'linked',
      todayHighlight: true,
      autoclose: true
    });
});