function isLoggedIn()
{
	return localStorage.getItem('token') !== null;
}

function clearToken()
{
	localStorage.removeItem('token');
}
