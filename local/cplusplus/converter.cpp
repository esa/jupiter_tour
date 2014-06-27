/* Converter.cpp */
using namespace std;

#include <vector>
#include <iostream>
#include <string>
#include <math.h>

static const double PI2 = 2.0*M_PI;
static const double d2r = 1.0/360.0*PI2;
static const double AU = 149597871000.0;

static void deg2rad(double &value) 
{
	value *= d2r;
}

static void cy2sec(double &value)
{
	value /= 3155760000;
}

void convert() 
{
	
	string name;
	cin >> name;

	double a,e,I,L,lP,lN,da,de,dI,dL,dlP,dlN;
	cin >> a >> e >> I >> L >> lP >> lN;
	cin >> da >> de >> dI >> dL >> dlP >> dlN;

	a *= AU;
	da *= AU;
	deg2rad(I);
	deg2rad(L);
	deg2rad(lP);
	deg2rad(lN);
	deg2rad(dI);
	deg2rad(dL);
	deg2rad(dlP);
	deg2rad(dlN);

	double M = L - lP;
	lP -= lN;

	double dM = dL - dlP;
	dlP -= dlN;

	cout << name << ":" << endl;
	cout << "\"orbitalElements\": {" << endl;
	cout << "\"sma\":" << a << "," << endl;
	cout << "\"ecc\":" << e << "," << endl;
	cout << "\"incl\":" << I << "," << endl;
	cout << "\"lan\":" << lN << "," << endl;
	cout << "\"ap\":" << lP << "," << endl;
	cout << "\"ma\":" << M << endl;
	cout << "}," << endl;
	cout << "\"orbitalElementDerivatives\":{" << endl;
	cout << "\"dsma\":" << da << "," << endl;
	cout << "\"decc\":" << de << "," << endl;
	cout << "\"dincl\":" << dI << "," << endl;
	cout << "\"dlan\":" << dlN << "," << endl;
	cout << "\"dap\":" << dlP << "," << endl;
	cout << "\"dma\":" << dM << endl;
	cout << "}" << endl;
	cout << endl;
}

int main(int argc, char *argv[])
{
	cout.precision(20);
	int n; cin >> n;
	while(n--)
	{
		convert();
	}
	return 0;
}