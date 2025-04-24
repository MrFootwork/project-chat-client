import './IndicatorUnread.css';

type Props = {
  visible: boolean;
  position?: { top?: string; left?: string; right?: string; bottom?: string };
  content?: string | number | null;
  pulse?: boolean;
};

const IndicatorUnread = ({ visible, position, content, pulse }: Props) => {
  return (
    <>
      {visible ? (
        <>
          <div className='indicator-on' style={{ ...position }}>
            <p>{content}</p>
            {pulse && <div className='pulse'></div>}
          </div>
        </>
      ) : (
        ''
      )}
    </>
  );
};

export default IndicatorUnread;
