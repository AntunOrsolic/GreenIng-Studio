<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get form data
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// Validation
$errors = [];

if (empty($name)) {
    $errors[] = 'Ime i prezime su obavezni.';
}

if (empty($email)) {
    $errors[] = 'Email je obavezan.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email adresa nije valjana.';
}

if (empty($message)) {
    $errors[] = 'Poruka je obavezna.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// Sanitize inputs
$name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$email = filter_var($email, FILTER_SANITIZE_EMAIL);
$phone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// Email configuration
// TODO: Update these values with your actual email address
$to = 'greeningstudio1@gmail.com'; //
$subject = 'Nova poruka s web stranice - GreenIng';

// Email body
$emailBody = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #a6ec8b; padding: 20px; text-align: center; }
        .content { background-color: #f8f9fa; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #2c3e50; }
        .value { margin-top: 5px; padding: 10px; background-color: #ffffff; border-left: 3px solid #a6ec8b; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Nova poruka s web stranice</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='label'>Ime i prezime:</div>
                <div class='value'>{$name}</div>
            </div>
            <div class='field'>
                <div class='label'>Email:</div>
                <div class='value'>{$email}</div>
            </div>
            " . (!empty($phone) ? "
            <div class='field'>
                <div class='label'>Broj telefona:</div>
                <div class='value'>{$phone}</div>
            </div>
            " : "") . "
            <div class='field'>
                <div class='label'>Poruka:</div>
                <div class='value'>" . nl2br($message) . "</div>
            </div>
        </div>
    </div>
</body>
</html>
";

// Email headers
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
$headers .= "From: Green Ing Web <noreply@green-ing.hr>" . "\r\n";
$headers .= "Reply-To: {$name} <{$email}>" . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email
$mailSent = @mail($to, $subject, $emailBody, $headers);

if ($mailSent) {
    // Optional: Send auto-reply to user
    $autoReplySubject = 'Potvrda primitka poruke - Green Ing';
    $autoReplyBody = "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #a6ec8b; padding: 20px; text-align: center; }
            .content { background-color: #f8f9fa; padding: 20px; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>Hvala vam na kontaktu!</h2>
            </div>
            <div class='content'>
                <p>Poštovani/a {$name},</p>
                <p>Primili smo vašu poruku i kontaktirat ćemo vas u najkraćem mogućem roku.</p>
                <p>Srdačan pozdrav,<br><strong>Green Ing tim</strong></p>
            </div>
        </div>
    </body>
    </html>
    ";
    
    $autoReplyHeaders = "MIME-Version: 1.0" . "\r\n";
    $autoReplyHeaders .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $autoReplyHeaders .= "From: Green Ing <noreply@green-ing.hr>" . "\r\n";
    
    @mail($email, $autoReplySubject, $autoReplyBody, $autoReplyHeaders);
    
    echo json_encode(['success' => true, 'message' => 'Poruka je uspješno poslana!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Došlo je do greške pri slanju poruke. Molimo pokušajte ponovno ili nas kontaktirajte direktno.']);
}
?>

