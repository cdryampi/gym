export interface PaymentTestProfile {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  state: string;
  city: string;
  address1: string;
  address2: string;
  postalCode: string;
  documentType: string;
  documentNumber: string;
  cardBrand: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export const defaultPeruPaymentTestProfile: PaymentTestProfile = {
  email: "sandbox-buyer.pe@novaforza.test",
  firstName: "Carlos",
  lastName: "Prueba",
  phone: "+51987654321",
  countryCode: "PE",
  state: "Lima",
  city: "Lima",
  address1: "Av. Javier Prado Este 560",
  address2: "San Isidro",
  postalCode: "15036",
  documentType: "DNI",
  documentNumber: "12345678",
  cardBrand: "visa",
  cardNumber: "4111111111111111",
  cardExpiry: "12/2030",
  cardCvv: "123",
};
