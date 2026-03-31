import React from 'react';
import Button from '../common/Button';
import '../../styles/components/wizard.css';

const NavigationButtons = ({
  onNext,
  onPrevious,
  onCancel,
  onFinish,
  isFirstStep = false,
  isLastStep = false,
  nextDisabled = false,
  previousDisabled = false,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  finishLabel = 'Finish',
  cancelLabel = 'Cancel',
  showCancel = true,
  loading = false
}) => {
  return (
    <div className="wizard-navigation">
      <div className="navigation-left">
        {showCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
      </div>
      
      <div className="navigation-right">
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={previousDisabled || loading}
          >
            {previousLabel}
          </Button>
        )}
        
        {!isLastStep ? (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={nextDisabled || loading}
            loading={loading}
          >
            {nextLabel}
          </Button>
        ) : (
          <Button
            variant="success"
            onClick={onFinish}
            loading={loading}
          >
            {finishLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NavigationButtons;