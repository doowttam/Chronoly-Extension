//
// Chronoly.js
//
// Init and utility functions for the app
//

var CHRONOLY = function() { return {

    api_token:    '',
    basecamp_url: '',
    base_url:     '',
    user_id:      null,
    minimized:    false,

    CONSTANTS: {
        MSINADAY: 86400000,
        MSINANHOUR: 3600000
    },

    init: function() {
        console.info('init');
        
        // Add onClick handlers
        $('#settings_link').click(this.showSettings);
        $('#about_link').click(this.showAbout);
        $('#help_link').click(this.showHelp);
        $('#settings_help_link').click(this.showHelp);
        $('#close_settings_link').click(this.hideSettings);
        
        // Set the date boxes
        this.dateToSelects(new Date());
        
        // Add onChanges to the selects
        $('#date_month').change(this.updateDateHint);
        $('#date_day').change(this.updateDateHint);
        $('#date_year').change(this.updateDateHint);
        
        // Set up the defaults for ajax
        $.ajaxSetup({
            contentType: 'application/xml',
            dataType: 'xml',
            timeout: 10000,
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " +  Base64.encode( CHRONOLY.api_token + ":X" ));
            },
            error: function(xhr, status_text, err) {
                console.error('Error: ' + status_text);
                CHRONOLY.hideLoading();
                if ( status_text.match('timeout') || xhr.status == 404 ) {
                    CHRONOLY.showSettings('There was a problem accessing Basecamp. Check your Basecamp url and try again.');
                } else if (xhr.status == 401) {
                    console.error('Bad credentials');
                    CHRONOLY.showSettings('There was a problem with your Basecamp api token.');
                } else {
                    console.log(xhr);
                }
            }
        });
        
        var need_settings = this.checkSettings();
        
        if ( need_settings == 1 ) {
            console.info('need settings');
            // If we didn't pull any data out of the store give them the settings screen
            this.showSettings();
        } else {
            this.initialRequest();
        }
        
        // Periodically get new time reports (just in case time was added through the Basecamp ui)
        // FIXME: This is a weird dependency. getTimeReports is in reports, but reports needs CHRONOLY
        // setInterval( this.reporter.getTimeReports, this.hoursToMS(0.5) );
        
        // Catch the date rolling over so we can update it for the user
        // this.initDateWatcher();
    },
    
    initialRequest: function() {
        // Get their user id from Basecamp. We could cache this, but this request on
        // start up is an opportunity to test their credentials and make sure
        // everything is in working order.
        $.get( this.base_url + '/me.xml', function(data) {
            CHRONOLY.user_id = $(data).find('person > id').text();
            
            $('#splash-screen').css('display', 'none');
            $('#main-window').css('display', 'block');
            
            CHRONOLY.reporter.getTimeReports();
            CHRONOLY.timeRecorder.getProjectList();
        });
    },
    
    checkSettings: function() {
        console.info('checking settings');

        this.api_token    = localStorage.getItem("api_token");
        this.basecamp_url = localStorage.getItem("basecamp_url");
        
        if ( basecamp_url != null ) {
            this.base_url = 'https://' + this.basecamp_url + '.basecamphq.com';
        }
        
        if ( this.api_token == null || this.basecamp_url == null )
            return 1;
        return 0;
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
    },
    
    // Convert a date to YYYYMMDD format
    dateToString: function(date) {
        var year = date.getFullYear().toString();
        var month = date.getMonth() + 1;
        if ( month < 10 )
            month = '0' + month;
        var date = date.getDate();
        if ( date < 10 )
            date = '0' + date;
        
        return year + month + date;
    },
    
    // Set the date selects to the passed in date
    dateToSelects: function(date) {
        $('#date_month').val(date.getMonth() + 1);
        $('#date_day').val(date.getDate());
        $('#date_year').val(date.getFullYear());
    },
    
    selectsToDate: function() {
        var date = new Date();
        date.setYear( parseInt( $('#date_year').val() ) );
        date.setDate( parseInt( $('#date_day').val() ) );
        date.setMonth( parseInt( $('#date_month').val() ) - 1);
        
        // Zero out the minutes, seconds, etc. since we don't have valid data for them
        date.setHours(0);
        date.setMilliseconds(0);
        date.setSeconds(0);
        date.setMinutes(0);
        
        return date;
    },
    
    verifyAndSaveSettings: function() {
        this.api_token = $('#api_token').val();
        this.basecamp_url = $('#basecamp_url').val();
        this.base_url = 'https://' + this.basecamp_url + '.basecamphq.com';
        
        $.ajax({
            url: this.base_url + '/me.xml',
            success: function(data) {
                // Set valid settings
                localStorage.setItem('api_token', CHRONOLY.api_token);
                localStorage.setItem('basecamp_url', CHRONOLY.basecamp_url);
                
                CHRONOLY.user_id = $(data).find('person > id').text();
                
                CHRONOLY.hideSettings();
                CHRONOLY.initialRequest();
            }
        });
    },
    
    showMessage: function(msg) {
        $('#main-msg').text(msg);
        $('#main-msg').css('display', 'block');
        setTimeout( function() { 
            $('#main-msg').css('display', 'none');
            $('#main-msg').text(''); 
        }, 5000 );
    },
    
    showLoading: function() {
        $('#loading').css('display', 'block');
    },
    
    hideLoading: function() {
        $('#loading').css('display', 'none');
    },
    
    msToHours: function(ms) {
        return ms / this.CONSTANTS.MSINANHOUR;
    },
   
    hoursToMS: function(hours) {
        return hours * this.CONSTANTS.MSINANHOUR;
    },
    
    showHelp: function() {
        window.open("/root/help.html");
    },
    
    showAbout: function() {
        window.open("/root/about.html");
    },
    
    generateDateHint: function(compareToDate) {
        var todaysDate = new Date();
        
        // Simplify our two dates by zeroing out hours and below
        todaysDate.setHours(0);
        todaysDate.setMinutes(0);
        todaysDate.setSeconds(0);
        todaysDate.setMilliseconds(0);
        compareToDate.setHours(0);
        compareToDate.setMinutes(0);
        compareToDate.setSeconds(0);
        compareToDate.setMilliseconds(0);
        
        var msDiff = compareToDate.getTime() - todaysDate.getTime();
        var days   = msDiff / this.CONSTANTS.MSINADAY;
        days       = days.toFixed(0);
        
        if ( days == 0 ) {
            // Today doesn't get a hint
            return null;
        } else if ( days > 0 && days <= 1 ) {
            return 'Tomorrow';
        } else if ( days < 0 && Math.abs(days) <= 1 ) {
            return 'Yesterday';
        } else if ( days < 0 ) {
            return Math.abs(days) + ' days ago';
        } else if ( days > 0 ) {
            return days + ' days from now';
        }
    },
    
    updateDateHint: function() {
        var hint = CHRONOLY.generateDateHint(CHRONOLY.selectsToDate());
        if ( hint != null ) {
            $('#date_hint').html(hint);
        } else {
            $('#date_hint').html('');
        }
    },
    
    initDateWatcher: function() {
        var selectsDate = this.selectsToDate();
        var now         = new Date();
        
        // If the selects are showing yesterday, update them to today
        // The * 2 is because selectsToDate returns the day at exactly midnight
        // so anything strictly less than two days ago is yesterday (or today, but that works too)
        var diff = now.getTime() - selectsDate.getTime();
        if (  diff > 0 && diff < this.CONSTANTS.MSINADAY * 2 ) {
            this.dateToSelects(now);
        }
        
        // Update the date hint regardless
        this.updateDateHint();
        
        // Set up the next check
        var midnight = new Date();
        midnight.setHours(23);
        midnight.setMilliseconds(999);
        midnight.setSeconds(59);
        midnight.setMinutes(59);
        
        var msUntilMidnight = midnight.getTime() - now.getTime() + 1;
        
        setTimeout(this.initDateWatcher, msUntilMidnight);
    }
    
}}();