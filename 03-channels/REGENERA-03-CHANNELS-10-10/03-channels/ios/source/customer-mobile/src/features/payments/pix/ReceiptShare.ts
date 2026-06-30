/**
 * @meta Domain: Mobile / Transfer
 * @description Logic for sharing transaction receipts.
 */

import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';

export const shareReceipt = async (viewRef: any) => {
  try {
    const uri = await ViewShot.captureRef(viewRef, { format: 'png' });
    await Share.open({ url: uri, message: 'Regenera Transaction Receipt' });
  } catch (err) {
    console.error('Error sharing receipt:', err);
  }
};
