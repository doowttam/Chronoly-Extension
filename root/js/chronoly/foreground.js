//
// recordTime.js
//
// Functions related to recording time in Basecamp
//

if ( typeof CHRONOLY === 'undefined' ) {
    CHRONOLY = {};
}

CHRONOLY.fg = function() { return {
    bg: null,

    init: function() {
        console.info('fg init');

        this.bg = this.getBackground();

        // Add onClick handlers
        $('#settings_link').click(this.showSettings);
        $('#about_link').click(this.showAbout);
        $('#help_link').click(this.showHelp);
        $('#settings_help_link').click(this.showHelp);
        $('#close_settings_link').click(this.hideSettings);
        
        // FIXME: may not want to actually do this every time

        // Set the date boxes
        this.bg.dateToSelects(new Date());
        
        // Add onChanges to the selects
        $('#date_month').change(this.updateDateHint);
        $('#date_day').change(this.updateDateHint);
        $('#date_year').change(this.updateDateHint);

        if ( this.bg.needSettings ) {
            this.showSettings();
        }
        else {
            $('#splash-screen').css('display', 'none');
            $('#main-window').css('display', 'block');
        }
    },

    getBackground: function() {
        return chrome.extension.getBackgroundPage().CHRONOLY;
    },

    showSettings: function(msg) {
        // Hack because the onclick eventhandlers pass in 
        // the event object as a parameter.
        if ( typeof msg != 'string' )
            msg = '';
        
        $('#settings_msg').text(msg);
        $('#basecamp_url').val(CHRONOLY.basecamp_url);
        $('#api_token').val(CHRONOLY.api_token);
        $('.settings').css('display', 'block');
    },
    
    hideSettings: function() {
        $('.settings').css('display', 'none');
    }
    
}}();
