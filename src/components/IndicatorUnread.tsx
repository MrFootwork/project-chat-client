import './IndicatorUnread.css';

type Props = {
  visible: boolean;
  position?: { top: string; left?: string; right?: string };
};

const IndicatorUnread = (props: Props) => {
  const { visible, position } = props;

  return (
    <>{visible ? <div className='indicator-on' style={position} /> : ''}</>
  );
};

export default IndicatorUnread;
