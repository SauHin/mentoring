// Soal studi kasus, contoh jawaban, dan gambar untuk Mid Exam Program Design Methods.
// Satu sumber untuk tiga halaman: notes.html dan slides.html (<div data-dg="kunci">), serta latihan.html (soal di kiri, kanvas di kanan).
// Format spec gambar: lihat komentar di awal _shared/diagram.js. Soal ditulis dalam bahasa Inggris, seperti kuis.
(function () {
  const D = DG.data;

  /* ---------- Contoh 1: Print Order Calculator (IPO, hierarchy, pseudocode, flowchart) ---------- */
  D['print.case'] = { html: `<p><strong>Case study: Print Order Calculator</strong></p>
<p>A print shop wants a simple Print Order Calculator for its cashier. The cashier selects the print type, enters the number of pages, and chooses whether the customer wants binding.</p>
<p>Black &amp; White (BW) printing costs IDR 500 per page and Color printing costs IDR 1,500 per page. Binding costs an additional IDR 5,000 per order. Before calculating the total cost, the program checks that a print type is selected and that the number of pages is greater than zero. If the input is invalid, the program displays an error message. Otherwise, it calculates the total cost and displays the order summary.</p>` };

  D['print.ipo'] = { ipo: [{
    module: 'Print Order Calculator (whole program)',
    input: ['printType (BW or Color)', 'pages', 'binding (Yes or No)'],
    process: ['Check that printType is BW or Color and pages > 0', 'If printType = Color, pricePerPage = 1500. Else, pricePerPage = 500', 'total = pages × pricePerPage', 'If binding = Yes, total = total + 5000'],
    output: ['Error message (if the input is invalid)', 'Order summary: printType, pages, binding, total'],
  }] };

  D['print.ipoMod'] = { ipo: [{
    module: 'calculateTotal',
    input: ['printType', 'pages', 'binding'],
    process: ['Call getPricePerPage(printType)', 'total = pages × pricePerPage', 'If binding = Yes, total = total + 5000'],
    output: ['total (return value)'],
  }, {
    module: 'getPricePerPage',
    input: ['printType'],
    process: ['If printType = Color, return 1500. Else, return 500'],
    output: ['pricePerPage (return value)'],
  }] };

  D['print.tree'] = { kind: 'tree', alt: 'Hierarchy chart Print Order Calculator', spec: `
mod main main
mod get getOrder
mod val isValidOrder
mod calc calculateTotal
mod show showSummary
mod price getPricePerPage
main > get
main > val
main > calc
main > show
calc > price` };

  D['print.code'] = { code: `Declare String printType
Declare Integer pages
Declare String binding
Declare Real pricePerPage
Declare Real total

Display "Print type (BW or Color)?"
Input printType
Display "Number of pages?"
Input pages
Display "Binding (Yes or No)?"
Input binding

If (printType == "BW" OR printType == "Color") AND pages > 0 Then
   If printType == "Color" Then
      Set pricePerPage = 1500
   Else
      Set pricePerPage = 500
   End If
   Set total = pages * pricePerPage
   If binding == "Yes" Then
      Set total = total + 5000
   End If
   Display "Print type: ", printType
   Display "Pages: ", pages
   Display "Binding: ", binding
   Display "Total: IDR ", total
Else
   Display "Error: choose BW or Color and enter pages > 0"
End If` };

  D['print.codeMain'] = { code: `Module main()
   Declare String printType, binding
   Declare Integer pages
   Declare Real total

   Call getOrder(printType, pages, binding)
   If isValidOrder(printType, pages) Then
      Set total = calculateTotal(printType, pages, binding)
      Call showSummary(printType, pages, binding, total)
   Else
      Display "Error: choose BW or Color and enter pages > 0"
   End If
End Module` };

  const PRINT_FLOW = `
term s 0 0 Start
io in 0 1 Input printType,\\npages, binding
dec v 0 2.2 printType valid\\nAND pages > 0?
io err 1.3 2.2 Display\\nerror message
dec c 0 3.6 printType\\n= Color?
proc bw -0.75 4.6 pricePerPage\\n= 500
proc col 0.75 4.6 pricePerPage\\n= 1500
proc t 0 5.7 total = pages ×\\npricePerPage
dec b 0 7 binding\\n= Yes?
proc add 0.75 8 total =\\ntotal + 5000
io out 0 9 Display printType,\\npages, binding, total
term e 0 10 End
s > in
in > v
v > c : Yes
v > err : No
err > e @v
c > col : Yes
c > bw : No
bw > t @t
col > t @t
t > b
b > add : Yes
b > out : No
add > out @t
out > e`;
  D['print.flow'] = { kind: 'flow', alt: 'Flowchart Print Order Calculator', spec: PRINT_FLOW };

  // Versi slide: dua kolom yang disambung connector A, supaya muat di layar 16:9.
  D['print.flowS'] = { kind: 'flow', grid: '220,66', alt: 'Flowchart Print Order Calculator dalam dua kolom', spec: `
term s 0 0 Start
io in 0 1 Input printType,\\npages, binding
dec v 0 2.35 printType valid\\nAND pages > 0?
io err 1.3 2.35 Display\\nerror message
dec c 0 3.7 printType = Color?
proc bw -0.8 4.6 pricePerPage = 500
proc col 0.8 4.6 pricePerPage = 1500
proc t 0 5.7 total = pages × pricePerPage
conn a1 0 6.55 A
conn a2 2.5 0 A
dec b 2.5 1.05 binding = Yes?
proc add 3.3 2 total = total + 5000
io out 2.5 3.2 Display printType,\\npages, binding, total
term e 2.5 4.15 End
s > in
in > v
v > c : Yes
v > err : No
err > e @v
c > col : Yes
c > bw : No
bw > t @t
col > t @t
t > a1
a2 > b
b > add : Yes
b > out : No
add > out @t
out > e` };

  /* ---------- Contoh 2: Online Library Loan System (DFD) ---------- */
  D['lib.case'] = { html: `<p><strong>Case study: Online Library Loan System</strong></p>
<p>A campus library wants to develop an Online Library Loan System. Members submit loan requests through the system. The system checks book availability, records the loan, updates the book status, and sends a loan receipt to the member.</p>
<p>When a member returns a book, the librarian enters the return data. The system updates the loan record and the book status, and sends the late fine, if any, to the librarian. At the end of each month, the system sends a loan report to the librarian. The system stores book data and loan records.</p>` };

  D['lib.ctx'] = { kind: 'dfd', alt: 'Context diagram Online Library Loan System', spec: `
ent m 0 170 =110x90 Member
dproc p 300 170 =190x110 [0] Online Library\\nLoan System
ent lib 620 170 =120x110 Librarian
m > p : Loan request
p > m : Loan receipt
lib > p : Return data
p > lib : Late fine
p > lib : Monthly report` };

  D['lib.l0'] = { kind: 'dfd', alt: 'DFD Level 0 Online Library Loan System', spec: `
ent m 0 0 Member
dproc p1 0 150 =170x86 [1] Process Loan
store d1 0 300 =170x40 [D1] Books
store d2 300 150 =160x40 [D2] Loans
dproc p2 300 300 =170x86 [2] Record Return
dproc p3 600 150 =170x86 [3] Generate Report
ent lib 600 300 =120x86 Librarian
m > p1 : Loan request
p1 > m : Loan receipt
d1 > p1 : Book availability
p1 > d1 : Book status
p1 > d2 : New loan
d2 > p2 : Loan record
p2 > d2 : Returned loan
p2 > d1 : Book status
d2 > p3 : Loan records
p3 > lib : Monthly report
lib > p2 : Return data
p2 > lib : Late fine` };

  D['lib.frag'] = { kind: 'dfd', alt: 'DFD fragment untuk process 2 Record Return', spec: `
store d2 300 0 =160x40 [D2] Loans
store d1 0 150 =170x40 [D1] Books
dproc p2 300 150 =170x86 [2] Record Return
ent lib 600 150 =120x86 Librarian
d2 > p2 : Loan record
p2 > d2 : Returned loan
p2 > d1 : Book status
lib > p2 : Return data
p2 > lib : Late fine` };

  D['lib.l1'] = { kind: 'dfd', alt: 'DFD Level 1 untuk process 1 Process Loan', spec: `
ent m 0 150 Member
dproc a 260 0 =170x78 [1.1] Check Book\\nAvailability
dproc b 260 150 =170x78 [1.2] Record Loan
dproc c 260 300 =170x78 [1.3] Issue Receipt
store d1 540 0 =160x40 [D1] Books
store d2 540 150 =160x40 [D2] Loans
m > a : Loan request
d1 > a : Book availability
a > b : Available book
b > d2 : New loan
b > d1 : Book status
b > c : Loan details
c > m : Loan receipt` };

  /* ---------- Latihan 1: Bike Rental Fee Calculator (GUI) ---------- */
  D['bike.case'] = { html: `<p><strong>Case study: Bike Rental Fee Calculator</strong></p>
<p>A bike rental shop wants to develop a Bike Rental Fee Calculator application to help staff calculate rental fees. The application allows staff to select a bike type and enter the rental duration in hours. When the Calculate Fee button is clicked, the application validates the input and calculates the rental fee based on the selected bike type and the duration.</p>
<p>The rental rates are as follows. City Bike: IDR 15,000 for the first hour and IDR 5,000 for each additional hour. E-Bike: IDR 25,000 for the first hour and IDR 10,000 for each additional hour. Rentals longer than 5 hours get a 10% discount on the total fee. The rental duration must be a positive whole number. If the input is invalid, the application displays an error message. Otherwise, the total rental fee is displayed. The Clear button resets all input fields and the displayed result.</p>` };

  D['bike.gui'] = { html: `<div class="gui" role="img" aria-label="Desain GUI Bike Rental Fee Calculator: dropdown Bike Type, kolom Rental Duration, tombol Calculate Fee dan Clear, dan label Total Rental Fee">
<p class="gui-title">BIKE RENTAL FEE CALCULATOR</p>
<p class="gui-sub">Calculate the rental fee</p>
<p class="gui-lbl">Bike Type</p>
<p class="gui-box">City Bike <span aria-hidden="true">▾</span></p>
<p class="gui-lbl">Rental Duration (hours)</p>
<p class="gui-box gui-ph">Enter duration, e.g. 3</p>
<p class="gui-btns"><span class="gui-go">Calculate Fee</span><span>Clear</span></p>
<p class="gui-lbl">Total Rental Fee</p>
<p class="gui-out">IDR 25,000<small>Example result: City Bike for 3 hours</small></p>
</div>` };

  D['bike.ipo'] = { ipo: [{
    module: 'calculateButton_Click (Calculate Fee button)',
    input: ['bikeType from the Bike Type dropdown', 'durationText from the Rental Duration text box'],
    process: ['Check that durationText is a whole number > 0', 'If bikeType = E-Bike, first = 25000 and extra = 10000. Else, first = 15000 and extra = 5000', 'fee = first + (hours − 1) × extra', 'If hours > 5, fee = fee × 0.9'],
    output: ['Error message (if the duration is invalid)', 'fee in the Total Rental Fee label'],
  }, {
    module: 'clearButton_Click (Clear button)',
    input: ['(none)'],
    process: ['Reset the dropdown to City Bike', 'Empty the duration text box'],
    output: ['Empty Total Rental Fee label'],
  }] };

  D['bike.code'] = { code: `Module calculateButton_Click()
   Declare String bikeType = bikeTypeDropdown.Text
   Declare String durationText = durationTextBox.Text
   Declare Integer hours
   Declare Real first, extra, fee

   If isInteger(durationText) AND stringToInteger(durationText) > 0 Then
      Set hours = stringToInteger(durationText)
      If bikeType == "E-Bike" Then
         Set first = 25000
         Set extra = 10000
      Else
         Set first = 15000
         Set extra = 5000
      End If
      Set fee = first + (hours - 1) * extra
      If hours > 5 Then
         Set fee = fee * 0.9
      End If
      Set totalLabel.Text = fee
   Else
      Set totalLabel.Text = "Error: enter a positive whole number"
   End If
End Module

Module clearButton_Click()
   Set bikeTypeDropdown.Text = "City Bike"
   Set durationTextBox.Text = ""
   Set totalLabel.Text = ""
End Module` };

  D['bike.calc'] = { kind: 'flow', alt: 'Flowchart tombol Calculate Fee', spec: `
term s 0 0 Calculate Fee\\nclicked
io in 0 1.05 Get bikeType and\\ndurationText from the form
dec v 0 2.35 durationText is\\na whole number > 0?
io err 1.4 2.35 Display error\\nin totalLabel
proc h 0 3.6 hours = durationText\\nas integer
dec c 0 4.75 bikeType\\n= E-Bike?
proc city -0.75 5.8 first = 15000\\nextra = 5000
proc eb 0.75 5.8 first = 25000\\nextra = 10000
proc fee 0 6.9 fee = first +\\n(hours − 1) × extra
dec d 0 8.1 hours > 5?
proc disc 0.75 9 fee = fee × 0.9
io out 0 10 Display fee\\nin totalLabel
term e 0 11 End
s > in
in > v
v > h : Yes
v > err : No
err > e @v
h > c
c > eb : Yes
c > city : No
city > fee @t
eb > fee @t
fee > d
d > disc : Yes
d > out : No
disc > out @t
out > e` };

  D['bike.clear'] = { kind: 'flow', alt: 'Flowchart tombol Clear', spec: `
term s 0 0 Clear clicked
proc r 0 1 Set bikeType dropdown\\nto City Bike
proc d 0 2 Empty the duration\\ntext box
io l 0 3 Display an empty\\ntotalLabel
term e 0 4 End
s > r
r > d
d > l
l > e` };

  /* ---------- Latihan 2: Online Clinic Appointment System (DFD) ---------- */
  D['clinic.case'] = { html: `<p><strong>Case study: Online Clinic Appointment System</strong></p>
<p>A clinic wants to develop an Online Clinic Appointment System. Patients choose a doctor and a time slot, then submit an appointment request. The system checks the doctor's schedule and sends a booking fee payment request to an external payment gateway. An appointment is confirmed only after the payment gateway verifies the payment, and the system then sends an appointment confirmation to the patient.</p>
<p>Doctors receive their daily appointment list and mark each appointment as completed. The administrator manages doctor schedules and receives a monthly report of appointments and payments. The system stores doctor schedules, appointments, and payment transactions.</p>` };

  D['clinic.ctx'] = { kind: 'dfd', alt: 'Context diagram Online Clinic Appointment System', spec: `
ent pat 300 0 =140x56 Patient
ent adm 0 170 =130x110 Administrator
dproc p 300 170 =200x110 [0] Online Clinic\\nAppointment System
ent doc 620 170 =120x110 Doctor
ent gw 300 340 =160x56 Payment Gateway
pat > p : Appointment request
p > pat : Appointment\\nconfirmation
adm > p : Schedule data
p > adm : Monthly report
doc > p : Completion status
p > doc : Daily appointment list
p > gw : Payment request
gw > p : Payment verification` };

  D['clinic.l0'] = { kind: 'dfd', alt: 'DFD Level 0 Online Clinic Appointment System', spec: `
ent adm -280 -320 =140x56 Administrator
dproc p1 -280 -160 =170x86 [1] Manage Doctor\\nSchedules
store d1 -280 0 =180x40 [D1] Doctor Schedules
ent pat 0 -160 =120x56 Patient
dproc p2 0 0 =170x86 [2] Book\\nAppointment
ent gw 0 160 =160x56 Payment Gateway
store d3 300 -160 =160x40 [D3] Payments
dproc p4 300 -320 =170x86 [4] Generate\\nMonthly Report
store d2 300 0 =180x40 [D2] Appointments
dproc p3 300 160 =170x86 [3] Manage Daily\\nAppointments
ent doc 300 320 =120x56 Doctor
adm > p1 : Schedule data
p1 > d1 : Schedule record
d1 > p2 : Available slots
pat > p2 : Appointment request
p2 > pat : Appointment\\nconfirmation
p2 > gw : Payment request
gw > p2 : Payment verification
p2 > d2 : New appointment
p2 > d3 : Payment record
d3 > p4 : Payment data
d2 > p4 : Appointment data @r
p4 > adm : Monthly report
d2 > p3 : Today's appointments
p3 > d2 : Completed appointment
p3 > doc : Daily appointment list
doc > p3 : Completion status` };

  D['clinic.l1'] = { kind: 'dfd', alt: 'DFD Level 1 untuk process 2 Book Appointment', spec: `
ent pat -20 210 =120x56 Patient
dproc a 260 0 =180x78 [2.1] Check Available\\nSlot
dproc b 260 140 =180x78 [2.2] Request\\nPayment
dproc c 260 280 =180x78 [2.3] Verify\\nPayment
dproc d 260 420 =180x78 [2.4] Confirm\\nAppointment
store d1 560 0 =180x40 [D1] Doctor Schedules
ent gw 560 180 =160x56 Payment Gateway
store d3 560 300 =160x40 [D3] Payments
store d2 560 420 =180x40 [D2] Appointments
pat > a : Appointment\\nrequest
d1 > a : Available slots
a > b : Selected slot
b > gw : Payment request
b > c : Pending booking
gw > c : Payment\\nverification
c > d3 : Payment record
c > d : Paid booking
d > d2 : New appointment
d > pat : Appointment\\nconfirmation` };

  /* ---------- Soal kuis PDM before mid, ditulis ulang dengan kalimat sendiri (dipakai slides) ---------- */
  // Kelas hl + warna menandai bagian soal: IPO (c-mint input, c-jingga processing, c-pink decision, c-lilac output),
  // DFD (c-jingga entity, c-mint process, c-lilac data store, c-pink data flow), sama dengan warna bentuk di diagram.
  D['tree.intro'] = { kind: 'tree', alt: 'Contoh hierarchy chart: main memanggil getScores, calcAverage, showGrade; calcAverage memanggil sumScores', spec: `
mod main main
mod g getScores
mod a calcAverage
mod s showGrade
mod sum sumScores
main > g
main > a
main > s
a > sum` };

  D['laundry.case'] = { html: `<p><strong>Soal 1 · Online Laundry Service System</strong></p>
<p>The customer <span class="hl c-mint">picks a laundry service</span>, <span class="hl c-mint">types the weight of the clothes</span>, and <span class="hl c-mint">decides whether to use express service</span>. <span class="hl c-jingga">Wash Only is IDR 8,000 per kg</span>, <span class="hl c-jingga">Wash and Iron is IDR 12,000 per kg</span>, <span class="hl c-jingga">express adds IDR 5,000 per order</span>, and <span class="hl c-jingga">at least 1 kg is always charged</span>.</p>
<p>The system first <span class="hl c-pink">makes sure every field is filled and the weight is above zero</span>. Bad input <span class="hl c-lilac">shows an error message</span>. Good input <span class="hl c-jingga">gets its total cost calculated</span> and is <span class="hl c-lilac">shown as an order summary</span>.</p>
<p><em>Task: draw a flowchart from entering the order until the total cost and the summary appear.</em></p>` };

  D['laundry.tree'] = { kind: 'tree', alt: 'Hierarchy chart soal laundry', spec: `
mod main main
mod get getOrderDetails
mod val isValidOrder
mod calc calculateTotal
mod show showSummary
mod price getPricePerKg
mod bill getBillableWeight
main > get
main > val
main > calc
main > show
calc > price
calc > bill` };

  // showSummary juga memanggil getPricePerKg (untuk mencetak harga per kg), jadi kotaknya muncul dua kali.
  D['laundry.tree2'] = { kind: 'tree', alt: 'Hierarchy chart dengan getPricePerKg di bawah calculateTotal dan di bawah showSummary', spec: `
mod main main
mod val isValidOrder
mod calc calculateTotal
mod show showSummary
mod price getPricePerKg
mod bill getBillableWeight
mod price2 getPricePerKg
main > val
main > calc
main > show
calc > price
calc > bill
show > price2` };

  D['laundry.flowS'] = { kind: 'flow', grid: '220,66', alt: 'Flowchart soal laundry dalam dua kolom', spec: `
term s 0 0 Start
io in 0 1 Input service,\\nweight, express
dec v 0 2.35 Data complete\\nAND weight > 0?
io err 1.25 2.35 Display\\nerror message
dec c 0 3.7 service = Wash Only?
proc p8 0.75 4.6 pricePerKg = 8000
proc p12 -0.75 4.6 pricePerKg = 12000
conn a1 0 5.65 A
conn a2 2.6 0 A
dec w 2.6 1.05 weight < 1?
proc b1 3.35 2 billable = 1
proc bw 1.85 2 billable = weight
proc t 2.6 3.15 total = billable ×\\npricePerKg
dec x 2.6 4.25 express = Yes?
proc add 3.35 5.1 total = total + 5000
io out 2.6 6.3 Display service, weight,\\nexpress, total
term e 2.6 7.2 End
s > in
in > v
v > c : Yes
v > err : No
err > e @v
c > p8 : Yes
c > p12 : No
p8 > a1 @t
p12 > a1 @t
a2 > w
w > b1 : Yes
w > bw : No
b1 > t @t
bw > t @t
t > x
x > add : Yes
x > out : No
add > out @t
out > e` };

  D['parking.case'] = { html: `<p><strong>Soal 2 · Parking Fee Calculator (GUI)</strong></p>
<p>Staff <span class="hl c-mint">pick the vehicle type</span> and <span class="hl c-mint">type the parking duration</span>, then press <b>Calculate Fee</b>. The app <span class="hl c-pink">checks that the duration is a positive whole number</span> and <span class="hl c-jingga">works out the fee from the vehicle type and the hours</span>.</p>
<p><span class="hl c-jingga">Motorcycle: IDR 2,000 for the first hour, IDR 1,000 for every extra hour.</span> <span class="hl c-jingga">Car: IDR 5,000 for the first hour, IDR 3,000 for every extra hour.</span> Invalid input <span class="hl c-lilac">shows an error message</span>, valid input <span class="hl c-lilac">shows the total fee</span>. <b>Clear</b> <span class="hl c-jingga">empties every field and the result</span>.</p>
<p><em>Task: draw a flowchart of the program logic that matches the GUI components.</em></p>` };

  D['parking.gui'] = { html: `<div class="gui" role="img" aria-label="Desain GUI Parking Fee Calculator: dropdown Vehicle Type, kolom Parking Duration, tombol Calculate Fee dan Clear, label Total Parking Fee">
<p class="gui-title">PARKING FEE CALCULATOR</p>
<p class="gui-sub">Calculate your parking charges</p>
<p class="gui-lbl">Vehicle Type</p>
<p class="gui-box">Car <span aria-hidden="true">▾</span></p>
<p class="gui-lbl">Parking Duration (hours)</p>
<p class="gui-box gui-ph">Enter duration, e.g. 3</p>
<p class="gui-btns"><span class="gui-go">Calculate Fee</span><span>Clear</span></p>
<p class="gui-lbl">Total Parking Fee</p>
<p class="gui-out">IDR 11,000<small>Example result: Car parked for 3 hours</small></p>
</div>` };

  D['parking.calc'] = { kind: 'flow', grid: '220,66', alt: 'Flowchart tombol Calculate Fee soal parking', spec: `
term s 0 0 Calculate Fee\\nclicked
io in 0 1.05 Get vehicle and\\ndurationText from the form
dec v 0 2.4 durationText is\\na whole number > 0?
io err 1.4 2.4 Display error\\nin feeLabel
proc h 0 3.85 hours = durationText\\nas integer
conn a1 0 4.75 A
conn a2 2.7 0 A
dec c 2.7 1.05 vehicle =\\nMotorcycle?
proc m 3.45 2.2 first = 2000\\nextra = 1000
proc car 1.95 2.2 first = 5000\\nextra = 3000
proc fee 2.7 3.45 fee = first +\\n(hours − 1) × extra
io out 2.7 4.5 Display fee\\nin feeLabel
term e 2.7 5.4 End
s > in
in > v
v > h : Yes
v > err : No
err > e @v
h > a1
a2 > c
c > m : Yes
c > car : No
m > fee @t
car > fee @t
fee > out
out > e` };

  D['parking.clear'] = { kind: 'flow', alt: 'Flowchart tombol Clear soal parking', spec: `
term s 0 0 Clear clicked
proc r 0 1 Reset the vehicle dropdown\\nand empty the duration box
io l 0 2 Display an empty\\nfeeLabel
term e 0 3 End
s > r
r > l
l > e` };

  D['catering.case'] = { html: `<p><strong>Soal 3 · Online Catering Order Management System</strong></p>
<p><span class="hl c-jingga">Customers</span> look through the menu and send an order: <span class="hl c-pink">food items, quantities, and delivery details</span>. The system <span class="hl c-mint">checks menu availability</span>, <span class="hl c-mint">calculates the order total</span>, and sends a <span class="hl c-pink">payment request</span> to an <span class="hl c-jingga">external payment service provider</span>. An order is <span class="hl c-mint">confirmed</span> only after the <span class="hl c-pink">payment is verified</span>.</p>
<p><span class="hl c-jingga">Kitchen staff</span> open the confirmed orders and <span class="hl c-pink">update the preparation status</span>. <span class="hl c-jingga">Delivery staff</span> get the <span class="hl c-pink">delivery information</span> and update the status when the food leaves and arrives. <span class="hl c-jingga">Administrators</span> <span class="hl c-mint">manage the menu</span> and its availability, and <span class="hl c-mint">produce reports</span> on order totals, payment status, and deliveries. The system keeps <span class="hl c-lilac">customer data</span>, <span class="hl c-lilac">menu details</span>, <span class="hl c-lilac">orders</span>, <span class="hl c-lilac">payment transactions</span>, and <span class="hl c-lilac">delivery information</span>.</p>
<p><em>Task: draw the Context Diagram, DFD Level 0, and DFD Level 1 for one Level 0 process (balanced).</em></p>` };

  D['catering.ctx'] = { kind: 'dfd', alt: 'Context diagram Online Catering Order Management System', spec: `
ent adm 330 0 =150x60 Administrator
ent cus 0 200 =120x130 Customer
dproc p 330 200 =200x220 [0] Online Catering\\nOrder Management\\nSystem
ent kit 690 140 =140x80 Kitchen Staff
ent ds 690 260 =140x80 Delivery Staff
ent pp 330 400 =160x60 Payment Provider
adm > p : Menu data
p > adm : Order report
cus > p : Order details
p > cus : Menu list
p > cus : Order confirmation
p > kit : Confirmed orders
kit > p : Preparation status
p > ds : Delivery info
ds > p : Delivery status
p > pp : Payment request
pp > p : Payment verification` };

  D['catering.frag2'] = { kind: 'dfd', alt: 'DFD fragment untuk process 2 Process Order', spec: `
store d2 300 0 =150x40 [D2] Menu
store d4 600 40 =160x40 [D4] Payments
ent cus 0 150 =120x130 Customer
dproc p2 300 150 =170x130 [2] Process Order
store d3 600 150 =150x40 [D3] Orders
ent pp 0 390 =140x60 Payment Provider
store d1 300 300 =160x40 [D1] Customers
d2 > p2 : Menu details
cus > p2 : Order details
p2 > cus : Menu list
p2 > cus : Order confirmation
p2 > pp : Payment request
pp > p2 : Payment verification
p2 > d1 : Customer data
d1 > p2 : Customer details
p2 > d4 : Payment record
p2 > d3 : Confirmed order` };

  D['catering.l0'] = { kind: 'dfd', alt: 'DFD Level 0 Online Catering Order Management System', spec: `
ent adm 0 -60 =150x60 Administrator
dproc p1 290 -60 =170x86 [1] Manage Menu
store d4 560 -60 =160x40 [D4] Payments
dproc p5 830 -60 =170x86 [5] Generate Report
store d2 290 60 =150x40 [D2] Menu
store d5 830 60 =160x40 [D5] Deliveries
ent cus 0 185 =120x130 Customer
dproc p2 290 185 =170x130 [2] Process Order
store d3 560 185 =150x40 [D3] Orders
dproc p4 830 185 =170x86 [4] Deliver Order
ent pp 0 420 =140x60 Payment Provider
store d1 330 330 =160x40 [D1] Customers
dproc p3 560 310 =170x86 [3] Prepare Order
ent ds 830 310 =140x60 Delivery Staff
ent kit 560 430 =140x60 Kitchen Staff
adm > p1 : Menu data
p1 > d2 : Menu record
p5 > adm : Order report @u
d2 > p2 : Menu details
cus > p2 : Order details
p2 > cus : Menu list
p2 > cus : Order confirmation
p2 > pp : Payment request
pp > p2 : Payment verification
p2 > d1 : Customer data
d1 > p2 : Customer details
p2 > d4 : Payment record
p2 > d3 : Confirmed order
d3 > p3 : Confirmed orders
p3 > d3 : Preparation status
p3 > kit : Confirmed orders
kit > p3 : Preparation status
d3 > p4 : Order to deliver
p4 > ds : Delivery info
ds > p4 : Delivery status
p4 > d5 : Delivery record
d3 > p5 : Order totals
d4 > p5 : Payment status
d5 > p5 : Delivery records` };

  D['catering.l1'] = { kind: 'dfd', alt: 'DFD Level 1 untuk process 2 Process Order', spec: `
ent cus 0 0 =120x86 Customer
dproc a 300 0 =180x86 [2.1] Receive Order
dproc b 300 130 =180x78 [2.2] Calculate\\nOrder Total
dproc c 300 260 =180x78 [2.3] Request\\nPayment
dproc d 300 390 =180x78 [2.4] Confirm Order
store d2 620 -40 =150x40 [D2] Menu
store d1 640 120 =160x40 [D1] Customers
ent pp 620 325 =150x60 Payment Provider
store d3 20 480 =150x40 [D3] Orders
store d4 620 460 =160x40 [D4] Payments
cus > a : Order details
a > cus : Menu list
d2 > a : Menu details
d1 > a : Customer details
a > d1 : Customer data
a > b : Order items
b > c : Order total
c > pp : Payment request
c > d : Pending order
pp > d : Payment verification
d > d4 : Payment record
d > d3 : Confirmed order
d > cus : Order confirmation @l` };

  /* ---------- Daftar soal untuk kanvas latihan ---------- */
  // tab: tab kanvas yang dibuka pertama. flow/dfd: nama halaman diagram. answers: [judul, kunci DG.data].
  DG.soal = [
    {
      id: 'print', title: 'Contoh 1 · Print Order Calculator', case: 'print.case', tab: 'ipo', flow: ['Flowchart'],
      tasks: ['Create an IPO chart for the program.', 'Create a hierarchy chart if the program is split into modules.', 'Write the pseudocode.', 'Create a flowchart from entering the order until the summary is displayed.'],
      answers: [['IPO chart', 'print.ipo'], ['Hierarchy chart', 'print.tree'], ['IPO chart per module', 'print.ipoMod'], ['Pseudocode', 'print.code'], ['Flowchart', 'print.flow']],
    },
    {
      id: 'library', title: 'Contoh 2 · Online Library Loan System', case: 'lib.case', tab: 'dfd',
      tasks: ['Context Diagram: the whole system as one process, with all external entities and data flows.', 'DFD Level 0: the major processes, data stores, and data flows.', 'DFD Level 1 for process 1 (Process Loan), balanced with Level 0.'],
      answers: [['Context diagram', 'lib.ctx'], ['DFD Level 0', 'lib.l0'], ['DFD Level 1: process 1 Process Loan', 'lib.l1']],
    },
    {
      id: 'bike', title: 'Latihan 1 · Bike Rental Fee Calculator (GUI)', case: 'bike.case', gui: 'bike.gui', tab: 'ipo', flow: ['Calculate Fee', 'Clear'],
      tasks: ['Create an IPO chart for the Calculate Fee button.', 'Write the pseudocode for the Calculate Fee and Clear buttons.', 'Based on the case study and the GUI design, create a flowchart for each button that shows how the application processes the input, validates the duration, calculates the fee, and displays the result.'],
      answers: [['IPO chart', 'bike.ipo'], ['Pseudocode', 'bike.code'], ['Flowchart: Calculate Fee button', 'bike.calc'], ['Flowchart: Clear button', 'bike.clear']],
    },
    {
      id: 'clinic', title: 'Latihan 2 · Online Clinic Appointment System (DFD)', case: 'clinic.case', tab: 'dfd',
      tasks: ['Context Diagram: represent the entire system as a single process, with the external entities and the data flows entering and leaving the system.', 'DFD Level 0: decompose the system into its major processes, with the relevant external entities, data stores, and data flows.', 'DFD Level 1: decompose process 2 (Book Appointment). Keep its inputs and outputs balanced with Level 0.'],
      answers: [['Context diagram', 'clinic.ctx'], ['DFD Level 0', 'clinic.l0'], ['DFD Level 1: process 2 Book Appointment', 'clinic.l1']],
    },
    { id: 'bebas', title: 'Kanvas bebas (soal sendiri)', free: true, tab: 'flow' },
  ];
})();
