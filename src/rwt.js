function executeAjax(url ,params, callback){

    var xhr = new XMLHttpRequest();
    xhr.open('post', url);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xhr.onreadystatechange = function(){
      if(xhr.readyState === 4){
         callback(xhr.status)
      }
    }

    xhr.send(params);
}

function RwtUi(rwt){

    document.write("<div id=\"widget-rwt-ui\" style=\"display:flex;position:fixed;bottom:0;right:0;background:#E3E2E2;padding:5px\">"+
        "<div id='widget-rwt-ui-content'></div>"+
         "<button id='widget-rwt-ui-connect'>Connect</button>"+
    "</div>")

     document.write("<style>#widget-rwt-ui{font-family: Georgia, serif;font-size:11px}</style>");
     document.write("<style>#widget-rwt-ui-content .state-1{color:#64B762}</style>");
     document.write("<style>#widget-rwt-ui-content .state-0{color:#CD4A4C}</style>");

    document.getElementById("widget-rwt-ui-connect")
        .onclick = () => {
            let ip_address = document.getElementById("widget-rwt-ui-connect-ip-address").value
            rwt.setClientIp(ip_address)
            rwt.connect()
        }

    const button = () => {
        document.getElementById("widget-rwt-ui-connect").hidden = false
        if (rwt.state == rwt.NOT_CONNECTED)
            return document.getElementById("widget-rwt-ui-connect").innerHTML = "Connect"
        if (rwt.state == rwt.CONNECTED)
            return document.getElementById("widget-rwt-ui-connect").innerHTML = "Reconnect"
        return document.getElementById("widget-rwt-ui-connect").hidden = true
    }
    const render = () => {
        document.getElementById("widget-rwt-ui-content").innerHTML = " Status: <b class='state-"+rwt.state+"'>" + rwt.getStatus()+"</b>"+
        "  Device: "+
        "<input type='text' id='widget-rwt-ui-connect-ip-address' value='"+rwt.lastClientIp+"' />"
        ;
    }

    rwt.onUiUpdate = () => {
        render()
    }
}

function RwtClass(){

    this.CONNECTED = 1
    this.CONNECTING = 2
    this.NOT_CONNECTED = 0

    const LOCAL_STORAGE_KEY = "rwt-client-ip"
    const CONNECTING_TIMEOUT = 3000

    const DATA_KEY_FORMAT = "FORMAT";
    const DATA_KEY_WRITE = "WRITE";
    const DATA_KEY_READ_VALID = "CARD";
    const DATA_KEY_READ_SECTOR = "SECTOR";

    this.connection = null
    this.lastClientIp = localStorage.getItem(LOCAL_STORAGE_KEY,"")
    this.state = 0
    var readData = []

    var writeCallback = null
    var readSectorCallback = null
    var readCallback = null

    this.initWidget = () => {
        RwtUi(this)
    }

    this.connect = () => {
        var CONNECTING = this.CONNECTING
        var CONNECTED = this.CONNECTED
        var NOT_CONNECTED = this.NOT_CONNECTED
        var self = this
        let lastClientIp = this.lastClientIp
        if (!lastClientIp)
            return

        if (this.connection != null && this.connection.readyState == 1)
            this.connection.close()

        connection = new WebSocket('ws://'+lastClientIp+':81/',['arduino'])
        self.state = CONNECTING

        self.onStateChange(self.state)
        self.onUiUpdate()
        
        var connectingTimer = setTimeout(() => {
            if (self.state == CONNECTING)
                connection.close()
        }, CONNECTING_TIMEOUT)

        connection.onopen = () => {
            self.state = CONNECTED
            self.onStateChange(self.state)
            self.onUiUpdate()
            clearTimeout(connectingTimer)
        }

        connection.onmessage = (event) => {
            let data_arr = event.data.split(":")
            if (data_arr[0].indexOf(DATA_KEY_READ_SECTOR) != -1){
                let key = parseInt(data_arr[0].replace(DATA_KEY_READ_SECTOR,""))
                let number = key > 10? key - 9: key - 8 
                let data = data_arr[1]
                readData[number] = data
                if (readSectorCallback)
                    readSectorCallback(number, data)
                return
            }

            if (data_arr[0] == DATA_KEY_READ_VALID){
                let data = data_arr[1]
                readCallback(data == "valid", readData)
                readData = []
                return
            }

            if (data_arr[0] == DATA_KEY_WRITE){
                let data = data_arr[1]
                writeCallback(data == "1")
            }
        }

        connection.onclose = () => {
            self.state = NOT_CONNECTED
            self.onStateChange(self.state)
            self.onUiUpdate()
            clearTimeout(connectingTimer)
        }
        
        this.connection = connection
    }

    this.write = (params, readyCallback, successCallback) => {

        writeCallback = successCallback
        var params = "block8=" + encodeURI( params[0] ) +
            "&block9=" + encodeURI( params[1] ) +
            "&block10=" + encodeURI( params[2] ) +
            "&block12=" + encodeURI( params[3] ) +
            "&block13=" + encodeURI( params[4] ) ;

        let ajax = executeAjax("http://"+this.lastClientIp+"/write", params, (status) => {
            readyCallback(status == 200)
        })
    }

    this.read = (callback, sectorCallback) => {
        readCallback = callback
        readSectorCallback = sectorCallback
    }

    this.setClientIp = (ip) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, ip)
        this.lastClientIp = ip
        return ip
    }

    this.getStatus = () => {
        if (this.state == this.CONNECTING)
            return "Connecting"
        if (this.state == this.CONNECTED)
            return "Connected"
        if (this.state == this.NOT_CONNECTED)
            return "Not Connected"
    }

    // abstract
    this.onStateChange = (state) => {}
    this.onUiUpdate = (state) => {}
}

var Rwt = new RwtClass()