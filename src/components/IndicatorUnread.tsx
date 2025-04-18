import './IndicatorUnread.css';

type Props = {
  visible: boolean;
  position?: { top: string; left?: string; right?: string };
  content?: string | number | null;
};

const IndicatorUnread = ({ visible, position, content }: Props) => {
  return (
    <>
      {visible ? (
        <div className='indicator-on' style={position}>
          <p>{content}</p>
        </div>
      ) : (
        ''
      )}
    </>
  );
};

export default IndicatorUnread;
