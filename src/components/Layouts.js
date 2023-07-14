import React, { Component, Fragment } from 'react';
import { isImmutable, List } from 'immutable';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

export const hasErrors = props => props.touched && props.errors.size > 0;

// Form Layout
export const FormLayout = ({ fields, error, buttons }) => (
  <form>
    <div class="form-group">
      {fields.toList()}
      {error}
      <div className="form-buttons">{buttons}</div>
    </div>
  </form>
);

// allows tables to define the fields desired for filtering / see SubmissionsList
export const generateFilterFormLayout = filterSet => ({ buttons, fields }) => (
  <Fragment>
    {filterSet.map(fs => (
      <Fragment key={fs}>{fields.get(fs)}</Fragment>
    ))}
    {buttons}
  </Fragment>
);

const isFiltering = appliedFilters =>
  appliedFilters.some(
    filterValue => isImmutable(filterValue) && filterValue.get('value') !== '',
  );

// default state for tables with no / missing data
export const generateEmptyBodyRow = ({
  loadingMessage = 'Loading items...',
  noSearchResultsMessage = 'No items were found - please modify your search criteria',
  noItemsMessage = 'There are no items to display.',
  noItemsLinkTo = null,
  noItemsLinkToMessage = 'Add new item',
  errorMessage = 'There was a problem loading information from the server!',
} = {}) => props => {
  // Because most uses wont pass renderOptions or renderOptions won't contain
  // `addAuthorized` we explicitly check for `false` not any falsey value.
  const addAuthorized =
    !props.renderOptions || props.renderOptions.addAuthorized !== false;

  const content = props.loading ? (
    /* Visible if there are no items in the list and your table is loading or initializing data. */

    <td colSpan={props.colSpan}>Loading...</td>
  ) : props.error ? (
    props.error.message ? (
      <td colSpan={props.colSpan} className="table-error-message">
        {errorMessage} <br /> <small>({props.error.message})</small>
      </td>
    ) : (
      <td colSpan={props.colSpan} className="table-error-message">
        {errorMessage}
      </td>
    )
  ) : isFiltering(props.appliedFilters) ? (
    /* Visible if there are no items in the list and you have filter criteria */

    <td className="no-data__title table-error-message">
      {noSearchResultsMessage}
    </td>
  ) : (
    /* Visible if there are no items in the list and you are not searching */
    <>
      <td className="no-data__title table-error-message">{noItemsMessage}</td>
      {addAuthorized && noItemsLinkTo ? (
        typeof noItemsLinkTo === 'function' ? (
          <button className="btn btn-link" onClick={noItemsLinkTo}>
            {noItemsLinkToMessage}
          </button>
        ) : (
          <Link to={noItemsLinkTo}>
            <span className="fa fa-plus fa-fw" />
            {noItemsLinkToMessage}
          </Link>
        )
      ) : null}
    </>
  );
  return <tr className="no-data text-center">{content}</tr>;
};

// Default Table Layout
export const TableLayout = ({ header, body, footer }) => (
  <div className="table-container">
    <table className="table" cellSpacing="0" cellPadding="0">
      {header}
      {body}
      {footer}
    </table>
  </div>
);

// Pagination Control
export const PaginationControl = ({
  nextPage,
  prevPage,
  loading,
  startIndex,
  endIndex,
  count,
}) => (
  <div className="table--footer d-flex justify-content-between align-items-center">
    <p className="pagination-label">
      {`Displaying ${startIndex} - ${endIndex}`}
    </p>
    {(nextPage || prevPage) && (
      <nav className="pagination-buttons">
        <button
          disabled={!prevPage || loading}
          onClick={prevPage}
          className="pagination-button"
        >
          <i
            className="fa fa-play fa-flip-horizontal d-block"
            aria-hidden="true"
          />
          Previous
        </button>
        <button
          disabled={!nextPage || loading}
          onClick={nextPage}
          className="pagination-button"
        >
          <i className="fa fa-play d-block" aria-hidden="true" />
          Next
        </button>
      </nav>
    )}
  </div>
);

// Field Wrapper
export const FieldWrapper = props => {
  const { EmptyOptionsPlaceholder } = props.renderAttributes
    ? props.renderAttributes.toObject()
    : {};

  return props.visible ? (
    <div className={classNames('form-group', props.className)}>
      {!props.omitLabel && (
        <label htmlFor={props.id} id={props.name}>
          {props.label}
          {props.required && <abbr title="required">*</abbr>}
        </label>
      )}

      {!props.enabled && props.renderAttributes.get('disabledMessage') ? (
        <p className="no-data">
          {props.renderAttributes.get('disabledMessage')}
        </p>
      ) : props.options &&
        props.options.isEmpty() &&
        EmptyOptionsPlaceholder ? (
        <EmptyOptionsPlaceholder />
      ) : (
        props.children
      )}
      {props.helpText && <small>{props.helpText}</small>}
      {hasErrors(props) && (
        <div>
          {props.errors.map(error => (
            <span className="help-block text-danger" key={error}>
              {error}
            </span>
          ))}
        </div>
      )}
    </div>
  ) : null;
};

export const TextField = props => (
  <FieldWrapper {...props}>
    <input
      className={`form-control${hasErrors(props) ? ' is-invalid' : ''}`}
      type="text"
      id={props.id}
      name={props.name}
      value={props.value}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.onFocus}
      placeholder={props.placeholder}
      disabled={!props.enabled}
    />
  </FieldWrapper>
);

export class TextMultiField extends Component {
  onEdit = index => event => {
    this.props.onChange(
      event.target.value
        ? this.props.value.set(index, event.target.value)
        : this.props.value.delete(index),
    );
  };

  onAdd = event => {
    this.props.onChange(this.props.value.push(event.target.value));
  };

  onRemove = index => () => {
    this.props.onChange(this.props.value.delete(index));
  };

  // When rendering the inputs we append an empty string to the list of values,
  // this is helpful because then the "new" input is in the keyed collection so
  // when text is entered there we get a smooth addition of another new input.
  render() {
    return (
      <FieldWrapper {...this.props}>
        {this.props.value.push('').map((selection, i) => (
          <div key={i} className="input-group selection mb-1">
            <input
              type="text"
              className="form-control"
              onBlur={this.props.onBlur}
              onChange={selection ? this.onEdit(i) : this.onAdd}
              onFocus={this.props.onFocus}
              placeholder={this.props.placeholder}
              value={selection}
            />
            {selection && (
              <div className="input-group-append">
                <button
                  className="btn btn-sm btn-clear"
                  onClick={this.onRemove(i)}
                  onFocus={this.props.onFocus}
                  onBlur={this.props.onBlur}
                  type="button"
                >
                  <span className="sr-only">Remove</span>
                  <i className="fa fa-fw fa-times" />
                </button>
              </div>
            )}
          </div>
        ))}
      </FieldWrapper>
    );
  }
}

// Password Field
export const PasswordField = props => (
  <FieldWrapper {...props}>
    <input
      className={`form-control${hasErrors(props) ? ' is-invalid' : ''}`}
      type="password"
      id={props.id}
      name={props.name}
      value={props.value}
      placeholder={props.placeholder}
      onBlur={props.onBlur}
      onChange={props.onChange}
      onFocus={props.onFocus}
      disabled={!props.enabled}
    />
  </FieldWrapper>
);

PasswordField.defaultProps = {
  errors: List(),
};

// Buttons
export const generateFormButtons = ({
  submitLabel,
  cancelPath,
  handleDelete,
  components,
} = {}) => props => {
  const LinkComponent = (components && components.Link) || Link;
  return (
    <div className="d-flex justify-content-between">
      {handleDelete && (
        <div className="form-buttons">
          <button
            className="btn btn-link text-danger"
            type="button"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      )}
      <div className="form-buttons ml-auto">
        <button
          className="btn btn-success"
          type="submit"
          disabled={!props.dirty || props.submitting}
          onClick={props.submit}
        >
          {props.submitting ? (
            <span className="fa fa-circle-o-notch fa-spin fa-fw" />
          ) : (
            <span className="fa fa-check fa-fw" />
          )}
          {submitLabel}
        </button>
        {cancelPath ? (
          typeof cancelPath === 'function' ? (
            <button type="button" className="btn btn-link" onClick={cancelPath}>
              Cancel
            </button>
          ) : (
            <LinkComponent className="btn btn-sm btn-link" to={cancelPath}>
              Cancel
            </LinkComponent>
          )
        ) : (
          <button
            type="button"
            className="btn btn-link"
            onClick={props.reset}
            disabled={!props.dirty || props.submitting}
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export const FormButtons = generateFormButtons({
  submitLabel: 'Save',
  cancelPath: null,
});
