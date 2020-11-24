# rfid-webtool
Library Javascript For RFID WebTool™

## Instalasi
- salin file `dist/rwt.min.js` ke folder project anda
- tambahkan code `<script src="dist/rwt.min.js"></script>`

## Penggunaan
tambahkan script dibawah ini. akan tampil widget untuk terhubung dengan device RFID WebTool™ 

    <script >
        Rwt.initWidget()
        Rwt.connect()
    </script>
    
untuk membaca data tag rfid saat ditempelkan. tambahkan code ini

    Rwt.read((valid, data) => {
      console.log("status tag", valid);
      console.log("data array", data);
    })
    
sedangkan untuk menuliskan data ke tag rfid. seperti berikut

    Rwt.write(data, (status) => {
        // ready callback
        console.log("status data siap di write", status)

    }, (success) => {
        // written sucessfully callback
        if (success)
            alert("RFID Tag written successfully")
        else
            alert("RFID Tag written not successfully")
    })
    
 ## Implementasi
silahkan dilihat di folder `example` ada beberapa file contoh penerapan kode
