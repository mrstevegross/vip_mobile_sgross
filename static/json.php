<?php
	$data = urlencode($_REQUEST['address']);
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "http://pollinglocation.googleapis.com/?q=" . $data);
	curl_exec($ch);
	curl_close($ch);
?>