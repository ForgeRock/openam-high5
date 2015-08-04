// Jo
username = "demo";

var devicePrint = requestData.getParameter('devicePrint');

                                logger.message("Starting authentication javascript (deviceprint)");
                                logger.message("User: " + username);
logger.message("DevicePrint: " + devicePrint);

                                // Log out current cookies in the request
                                if (logger.messageEnabled()) {
                                    var cookies = requestData.getHeaders('Cookie');
                                    for (cookie in cookies) {
                                        logger.message('Cookie: ' + cookies[cookie]);
                                    }
                                }
//Jo
if (devicePrint != null) {
  authState = SUCCESS;
} else {
  authState = FAILED;
}
