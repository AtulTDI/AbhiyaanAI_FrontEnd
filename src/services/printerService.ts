import ThermalPrinter from 'react-native-thermal-printer';

class PrinterService {
  static async printVoterSlip(voter) {
    const payload = `
--------------------------------
        VOTER SLIP
--------------------------------
Name   : ${voter.name}
Booth  : ${voter.boothNo}
Part   : ${voter.partNo}
Serial : ${voter.serialNo}
Address: ${voter.address}
--------------------------------
Thank You
`;

    try {
      await ThermalPrinter.printBluetooth({
        payload,
        printerNbrCharactersPerLine: 32,
      });
      return { success: true };
    } catch (error) {
      console.error('Print Error:', error);
      return { success: false, error };
    }
  }
}

export default PrinterService;